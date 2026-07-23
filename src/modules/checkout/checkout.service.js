'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const { AppError } = require('../../utils/AppError');
const paymentService = require('../payment/payment.service');
const cartService = require('../cart/cart.service');

/** Flat tax rate applied to the post-discount subtotal. */
const TAX_RATE = 0.1;

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Safely parses a database field that may be stored as JSON text or already
 * parsed to an object (e.g. JSONB columns returned by pg).
 *
 * @param {string|object|null} field
 * @returns {object|null}
 */
function parseJsonField(field) {
  if (field === null || field === undefined) return null;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
}

/**
 * Loads a pending order that belongs to the given user or guest.
 * Throws a 404 AppError when no matching session is found.
 *
 * @param {string}      checkoutId
 * @param {string|null} userId
 * @param {string|null} guestToken
 * @returns {Promise<object>}
 */
async function findPendingOrder(checkoutId, userId, guestToken) {
  const { rows } = await db.query(
    `SELECT *
       FROM orders
      WHERE id     = $1
        AND status = 'pending'
        AND (user_id = $2 OR guest_token = $3)
      LIMIT 1`,
    [checkoutId, userId, guestToken]
  );

  if (!rows.length) {
    throw new AppError('Checkout session not found or already completed', 404);
  }

  const row = rows[0];
  return {
    ...row,
    items: parseJsonField(row.items),
    shipping_address: parseJsonField(row.shipping_address),
    billing_address: parseJsonField(row.billing_address),
  };
}

/**
 * Verifies that every item in the list has sufficient stock.
 * Throws a 409 AppError on the first item that fails.
 *
 * @param {Array<{productId: string, quantity: number}>} items
 * @returns {Promise<void>}
 */
async function confirmStockReservation(items) {
  for (const item of items) {
    const { rows } = await db.query(
      `SELECT stock_quantity FROM products WHERE id = $1 LIMIT 1`,
      [item.productId]
    );

    if (!rows.length) {
      throw new AppError(`Product ${item.productId} not found`, 404);
    }

    if (rows[0].stock_quantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for product ${item.productId}`,
        409
      );
    }
  }
}

/**
 * Looks up the promo code, validates it, and returns the monetary discount.
 * Throws a 400 AppError if the code is invalid or expired.
 *
 * @param {string} promoCode
 * @param {number} subtotal
 * @returns {Promise<number>} Discount amount in the same currency unit as subtotal.
 */
async function applyPromoCode(promoCode, subtotal) {
  const { rows } = await db.query(
    `SELECT *
       FROM promo_codes
      WHERE code      = $1
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1`,
    [promoCode]
  );

  if (!rows.length) {
    throw new AppError('Invalid or expired promo code', 400);
  }

  const promo = rows[0];

  if (promo.discount_type === 'percentage') {
    return parseFloat(
      ((Number(subtotal) * Number(promo.discount_value)) / 100).toFixed(2)
    );
  }

  // Fixed-amount discount — capped at the subtotal
  return Math.min(Number(promo.discount_value), Number(subtotal));
}

/**
 * Computes tax and total given a subtotal and a pre-calculated discount.
 *
 * @param {number} subtotal
 * @param {number} discount
 * @returns {{tax: number, total: number}}
 */
function computeTotals(subtotal, discount) {
  const taxableAmount = Number(subtotal) - discount;
  const tax = parseFloat((taxableAmount * TAX_RATE).toFixed(2));
  const total = parseFloat((taxableAmount + tax).toFixed(2));
  return { tax, total };
}

// ── Service ───────────────────────────────────────────────────────────────────

const CheckoutService = {
  /**
   * Initiates a checkout session from an existing cart.
   *
   * Steps:
   *   1. Loads and validates the cart (must be non-empty).
   *   2. Confirms initial stock availability for all items.
   *   3. Computes the subtotal.
   *   4. Persists a new pending order (serves as the checkout session record).
   *
   * For guest users, a new guestToken is generated when none is supplied; it is
   * returned to the caller so the client can include it in subsequent requests.
   *
   * @param {{cartId: string, userId: string|null, guestEmail: string|null, guestToken: string|null}} params
   * @returns {Promise<{checkoutId: string, subtotal: number, items: object[], guestToken?: string}>}
   */
  async startCheckout({ cartId, userId, guestEmail, guestToken }) {
    // 1. Resolve or generate a guest token for unauthenticated users
    const resolvedGuestToken = userId ? null : (guestToken || uuidv4());

    // 2. Load and validate the cart
    const cart = await cartService.getCart({ cartId, userId, guestToken: resolvedGuestToken });

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      throw new AppError('Cart is empty or does not exist', 400);
    }

    // 3. Confirm initial stock
    await confirmStockReservation(cart.items);

    // 4. Compute subtotal
    const subtotal = parseFloat(
      cart.items
        .reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
        .toFixed(2)
    );

    // 5. Persist the pending order
    const checkoutId = uuidv4();

    await db.query(
      `INSERT INTO orders
         (id, user_id, guest_email, guest_token, cart_id,
          status, items, subtotal, discount, tax, total, created_at, updated_at)
       VALUES
         ($1, $2, $3, $4, $5, 'pending', $6, $7, 0, 0, $7, NOW(), NOW())`,
      [
        checkoutId,
        userId || null,
        guestEmail || null,
        resolvedGuestToken,
        cartId,
        JSON.stringify(cart.items),
        subtotal,
      ]
    );

    const response = { checkoutId, subtotal, items: cart.items };

    // Surface the generated guest token so the client can persist it
    if (!userId && resolvedGuestToken) {
      response.guestToken = resolvedGuestToken;
    }

    return response;
  },

  /**
   * Saves the shipping (and optionally billing) address for an existing checkout session.
   *
   * When sameAsBilling is true the billing address mirrors the shipping address.
   *
   * @param {{
   *   checkoutId: string,
   *   userId: string|null,
   *   guestToken: string|null,
   *   shippingAddress: object,
   *   billingAddress: object|null,
   *   sameAsBilling: boolean
   * }} params
   * @returns {Promise<{checkoutId: string, shippingAddress: object, billingAddress: object}>}
   */
  async saveAddress({ checkoutId, userId, guestToken, shippingAddress, billingAddress, sameAsBilling }) {
    // Verify ownership
    await findPendingOrder(checkoutId, userId, guestToken);

    const resolvedBilling = sameAsBilling ? shippingAddress : (billingAddress || shippingAddress);

    await db.query(
      `UPDATE orders
          SET shipping_address = $1,
              billing_address  = $2,
              updated_at       = NOW()
        WHERE id = $3`,
      [JSON.stringify(shippingAddress), JSON.stringify(resolvedBilling), checkoutId]
    );

    return { checkoutId, shippingAddress, billingAddress: resolvedBilling };
  },

  /**
   * Returns the full checkout summary for the review step.
   *
   * @param {{checkoutId: string, userId: string|null, guestToken: string|null}} params
   * @returns {Promise<object>}
   */
  async getCheckoutReview({ checkoutId, userId, guestToken }) {
    const order = await findPendingOrder(checkoutId, userId, guestToken);

    return {
      checkoutId: order.id,
      items: order.items,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      subtotal: parseFloat(order.subtotal),
      discount: parseFloat(order.discount),
      tax: parseFloat(order.tax),
      total: parseFloat(order.total),
      promoCode: order.promo_code || null,
    };
  },

  /**
   * Places the order.
   *
   * Steps:
   *   1. Loads the pending order and verifies a shipping address is present.
   *   2. Performs a final stock confirmation.
   *   3. Applies the promo code discount (if provided).
   *   4. Recalculates tax and total.
   *   5. Delegates payment intent creation to the payment service.
   *   6. Transitions the order status to 'processing'.
   *
   * @param {{
   *   checkoutId: string,
   *   userId: string|null,
   *   guestToken: string|null,
   *   paymentMethodId: string,
   *   promoCode: string|null
   * }} params
   * @returns {Promise<{
   *   orderId: string,
   *   status: string,
   *   total: number,
   *   paymentIntentClientSecret: string
   * }>}
   */
  async placeOrder({ checkoutId, userId, guestToken, paymentMethodId, promoCode }) {
    // 1. Load pending order
    const order = await findPendingOrder(checkoutId, userId, guestToken);

    // 2. Shipping address is mandatory before placement
    if (!order.shipping_address) {
      throw new AppError(
        'A shipping address must be provided before placing an order',
        400
      );
    }

    // 3. Final stock confirmation
    await confirmStockReservation(order.items);

    // 4. Finalise promo code
    let discount = 0;
    if (promoCode) {
      discount = await applyPromoCode(promoCode, order.subtotal);
    }

    // 5. Recalculate totals
    const { tax, total } = computeTotals(order.subtotal, discount);

    // 6. Delegate payment intent creation
    const paymentIntent = await paymentService.createPaymentIntent({
      amount: Math.round(total * 100), // smallest currency unit (cents)
      currency: 'usd',
      paymentMethodId,
      metadata: { orderId: checkoutId },
    });

    // 7. Transition order to 'processing'
    await db.query(
      `UPDATE orders
          SET status            = 'processing',
              promo_code        = $1,
              discount          = $2,
              tax               = $3,
              total             = $4,
              payment_intent_id = $5,
              updated_at        = NOW()
        WHERE id = $6`,
      [promoCode || null, discount, tax, total, paymentIntent.id, checkoutId]
    );

    return {
      orderId: checkoutId,
      status: 'processing',
      total,
      paymentIntentClientSecret: paymentIntent.client_secret,
    };
  },
};

module.exports = CheckoutService;
