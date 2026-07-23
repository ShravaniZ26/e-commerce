'use strict';

const checkoutService = require('./checkout.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolves the guest token from the request. Clients may pass it either via the
 * X-Guest-Token header (preferred for step 2+) or in the request body (step 1).
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function resolveGuestToken(req) {
  return req.headers['x-guest-token'] || req.body.guestToken || null;
}

/**
 * Unified error responder.
 *
 * @param {import('express').Response} res
 * @param {Error & {statusCode?: number; status?: number}} error
 */
function handleError(res, error) {
  const statusCode = error.statusCode || error.status || 500;
  return res.status(statusCode).json({
    status: 'error',
    message: error.message || 'An unexpected error occurred',
  });
}

// ── Controller ────────────────────────────────────────────────────────────────

const CheckoutController = {
  /**
   * POST /checkout/start
   * Initiates a checkout session from a cart. Supports guest and authenticated users.
   */
  async startCheckout(req, res) {
    try {
      const { cartId, guestEmail } = req.body;
      const userId = req.user?.id || null;
      const guestToken = resolveGuestToken(req);

      const result = await checkoutService.startCheckout({
        cartId,
        userId,
        guestEmail: guestEmail || null,
        guestToken,
      });

      return res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  /**
   * POST /checkout/address
   * Saves shipping and optional billing address for the checkout session.
   */
  async saveAddress(req, res) {
    try {
      const { checkoutId, shippingAddress, billingAddress, sameAsBilling } = req.body;
      const userId = req.user?.id || null;
      const guestToken = resolveGuestToken(req);

      const result = await checkoutService.saveAddress({
        checkoutId,
        userId,
        guestToken,
        shippingAddress,
        billingAddress: billingAddress || null,
        sameAsBilling: sameAsBilling !== false,
      });

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  /**
   * GET /checkout/review
   * Returns the full checkout summary before order placement.
   */
  async reviewCheckout(req, res) {
    try {
      const { checkoutId } = req.query;
      const userId = req.user?.id || null;
      const guestToken = resolveGuestToken(req);

      if (!checkoutId) {
        return res.status(400).json({
          status: 'error',
          message: 'checkoutId query parameter is required',
        });
      }

      const result = await checkoutService.getCheckoutReview({
        checkoutId,
        userId,
        guestToken,
      });

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  /**
   * POST /checkout/place-order
   * Finalises the order and delegates payment intent creation.
   */
  async placeOrder(req, res) {
    try {
      const { checkoutId, paymentMethodId, promoCode } = req.body;
      const userId = req.user?.id || null;
      const guestToken = resolveGuestToken(req);

      const result = await checkoutService.placeOrder({
        checkoutId,
        userId,
        guestToken,
        paymentMethodId,
        promoCode: promoCode || null,
      });

      return res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
};

module.exports = CheckoutController;
