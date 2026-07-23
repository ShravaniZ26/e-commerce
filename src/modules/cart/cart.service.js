'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../../db');

const CART_STATUS = {
  ACTIVE: 'active',
  MERGED: 'merged',
  CONVERTED: 'converted',
  ABANDONED: 'abandoned',
};

const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

async function createCart({ userId = null, sessionId = null } = {}) {
  if (userId) {
    const existingCart = await db('carts')
      .where({ user_id: userId, status: CART_STATUS.ACTIVE })
      .first();
    if (existingCart) {
      return getCartById(existingCart.id);
    }
  }

  const cartId = uuidv4();
  const now = new Date().toISOString();

  await db('carts').insert({
    id: cartId,
    user_id: userId,
    session_id: sessionId,
    status: CART_STATUS.ACTIVE,
    promo_code: null,
    promo_id: null,
    promo_discount_type: null,
    promo_discount_value: null,
    subtotal: 0,
    discount: 0,
    total: 0,
    created_at: now,
    updated_at: now,
  });

  return getCartById(cartId);
}

async function getCartById(cartId) {
  const cart = await db('carts').where({ id: cartId }).first();

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const items = await db('cart_items')
    .where({ cart_id: cartId })
    .orderBy('created_at', 'asc');

  return { ...cart, items };
}

async function addItem(cartId, { productId, variantId = null, quantity }) {
  const cart = await db('carts')
    .where({ id: cartId, status: CART_STATUS.ACTIVE })
    .first();

  if (!cart) {
    throw new AppError('Cart not found or is not active', 404);
  }

  await validateStock(productId, variantId, quantity);
  const { unitPrice } = await getProductPrice(productId, variantId);

  const itemQuery = { cart_id: cartId, product_id: productId };
  if (variantId) {
    itemQuery.variant_id = variantId;
  } else {
    itemQuery.variant_id = null;
  }

  const existingItem = await db('cart_items').where(itemQuery).first();
  const now = new Date().toISOString();

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    await validateStock(productId, variantId, newQuantity);

    await db('cart_items').where({ id: existingItem.id }).update({
      quantity: newQuantity,
      total_price: parseFloat((unitPrice * newQuantity).toFixed(2)),
      updated_at: now,
    });
  } else {
    await db('cart_items').insert({
      id: uuidv4(),
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
      unit_price: unitPrice,
      total_price: parseFloat((unitPrice * quantity).toFixed(2)),
      created_at: now,
      updated_at: now,
    });
  }

  await recalculateCart(cartId);
  return getCartById(cartId);
}

async function updateItem(cartId, itemId, { quantity }) {
  const cart = await db('carts')
    .where({ id: cartId, status: CART_STATUS.ACTIVE })
    .first();

  if (!cart) {
    throw new AppError('Cart not found or is not active', 404);
  }

  const item = await db('cart_items')
    .where({ id: itemId, cart_id: cartId })
    .first();

  if (!item) {
    throw new AppError('Cart item not found', 404);
  }

  const now = new Date().toISOString();

  if (quantity === 0) {
    await db('cart_items').where({ id: itemId }).delete();
  } else {
    await validateStock(item.product_id, item.variant_id, quantity);
    await db('cart_items').where({ id: itemId }).update({
      quantity,
      total_price: parseFloat((parseFloat(item.unit_price) * quantity).toFixed(2)),
      updated_at: now,
    });
  }

  await recalculateCart(cartId);
  return getCartById(cartId);
}

async function removeItem(cartId, itemId) {
  const cart = await db('carts')
    .where({ id: cartId, status: CART_STATUS.ACTIVE })
    .first();

  if (!cart) {
    throw new AppError('Cart not found or is not active', 404);
  }

  const item = await db('cart_items')
    .where({ id: itemId, cart_id: cartId })
    .first();

  if (!item) {
    throw new AppError('Cart item not found', 404);
  }

  await db('cart_items').where({ id: itemId }).delete();
  await recalculateCart(cartId);
  return getCartById(cartId);
}

async function applyPromo(cartId, code) {
  const cart = await db('carts')
    .where({ id: cartId, status: CART_STATUS.ACTIVE })
    .first();

  if (!cart) {
    throw new AppError('Cart not found or is not active', 404);
  }

  const normalizedCode = code.trim().toUpperCase();

  const promo = await db('promo_codes')
    .where({ code: normalizedCode, is_active: true })
    .where(function () {
      this.whereNull('expires_at').orWhere('expires_at', '>', new Date().toISOString());
    })
    .first();

  if (!promo) {
    throw new AppError('Invalid or expired promo code', 422);
  }

  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    throw new AppError('Promo code usage limit has been reached', 422);
  }

  if (
    promo.minimum_order_amount !== null &&
    parseFloat(cart.subtotal) < parseFloat(promo.minimum_order_amount)
  ) {
    throw new AppError(
      `Order subtotal must be at least ${promo.minimum_order_amount} to use this promo code`,
      422
    );
  }

  await db('carts').where({ id: cartId }).update({
    promo_code: promo.code,
    promo_id: promo.id,
    promo_discount_type: promo.discount_type,
    promo_discount_value: promo.discount_value,
    updated_at: new Date().toISOString(),
  });

  await recalculateCart(cartId);
  return getCartById(cartId);
}

async function removePromo(cartId) {
  const cart = await db('carts')
    .where({ id: cartId, status: CART_STATUS.ACTIVE })
    .first();

  if (!cart) {
    throw new AppError('Cart not found or is not active', 404);
  }

  if (!cart.promo_code) {
    throw new AppError('No promo code is applied to this cart', 422);
  }

  await db('carts').where({ id: cartId }).update({
    promo_code: null,
    promo_id: null,
    promo_discount_type: null,
    promo_discount_value: null,
    discount: 0,
    updated_at: new Date().toISOString(),
  });

  await recalculateCart(cartId);
  return getCartById(cartId);
}

async function mergeGuestCart(guestCartId, userId) {
  const guestCart = await db('carts')
    .where({ id: guestCartId, status: CART_STATUS.ACTIVE })
    .whereNull('user_id')
    .first();

  if (!guestCart) {
    return null;
  }

  const userCart = await db('carts')
    .where({ user_id: userId, status: CART_STATUS.ACTIVE })
    .first();

  const now = new Date().toISOString();

  if (!userCart) {
    await db('carts').where({ id: guestCartId }).update({
      user_id: userId,
      session_id: null,
      updated_at: now,
    });
    return getCartById(guestCartId);
  }

  const guestItems = await db('cart_items').where({ cart_id: guestCartId });

  for (const guestItem of guestItems) {
    const matchQuery = {
      cart_id: userCart.id,
      product_id: guestItem.product_id,
    };
    if (guestItem.variant_id) {
      matchQuery.variant_id = guestItem.variant_id;
    } else {
      matchQuery.variant_id = null;
    }

    const existingItem = await db('cart_items').where(matchQuery).first();

    if (existingItem) {
      const newQuantity = existingItem.quantity + guestItem.quantity;
      await db('cart_items').where({ id: existingItem.id }).update({
        quantity: newQuantity,
        total_price: parseFloat((parseFloat(existingItem.unit_price) * newQuantity).toFixed(2)),
        updated_at: now,
      });
    } else {
      await db('cart_items').insert({
        id: uuidv4(),
        cart_id: userCart.id,
        product_id: guestItem.product_id,
        variant_id: guestItem.variant_id,
        quantity: guestItem.quantity,
        unit_price: guestItem.unit_price,
        total_price: guestItem.total_price,
        created_at: now,
        updated_at: now,
      });
    }
  }

  await db('carts').where({ id: guestCartId }).update({
    status: CART_STATUS.MERGED,
    updated_at: now,
  });

  await recalculateCart(userCart.id);
  return getCartById(userCart.id);
}

async function validateStock(productId, variantId, quantity) {
  let record;

  if (variantId) {
    record = await db('product_variants')
      .where({ id: variantId, product_id: productId })
      .select('stock_quantity', 'is_in_stock')
      .first();
  } else {
    record = await db('products')
      .where({ id: productId })
      .select('stock_quantity', 'is_in_stock')
      .first();
  }

  if (!record) {
    throw new AppError('Product not found', 404);
  }

  if (!record.is_in_stock || record.stock_quantity < quantity) {
    throw new AppError('Insufficient stock for the requested quantity', 422);
  }
}

async function getProductPrice(productId, variantId) {
  let record;

  if (variantId) {
    record = await db('product_variants')
      .where({ id: variantId, product_id: productId })
      .select('price')
      .first();
  } else {
    record = await db('products')
      .where({ id: productId })
      .select('price')
      .first();
  }

  if (!record) {
    throw new AppError('Product not found', 404);
  }

  return { unitPrice: parseFloat(record.price) };
}

async function recalculateCart(cartId) {
  const cart = await db('carts').where({ id: cartId }).first();
  const items = await db('cart_items').where({ cart_id: cartId });

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.total_price || 0),
    0
  );

  let discount = 0;
  if (cart.promo_discount_type && cart.promo_discount_value !== null) {
    const discountValue = parseFloat(cart.promo_discount_value);
    if (cart.promo_discount_type === DISCOUNT_TYPE.PERCENTAGE) {
      discount = subtotal * (discountValue / 100);
    } else if (cart.promo_discount_type === DISCOUNT_TYPE.FIXED) {
      discount = Math.min(discountValue, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discount);

  await db('carts').where({ id: cartId }).update({
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    updated_at: new Date().toISOString(),
  });
}

module.exports = {
  createCart,
  getCartById,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
  mergeGuestCart,
};
