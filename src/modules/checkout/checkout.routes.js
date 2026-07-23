'use strict';

const { Router } = require('express');
const checkoutController = require('./checkout.controller');
const {
  validateStartCheckout,
  validateSaveAddress,
  validatePlaceOrder,
} = require('./checkout.validator');
const { optionalAuth } = require('../../middleware/optionalAuth');

const router = Router();

/**
 * POST /checkout/start
 * Initiates a new checkout session from an existing cart.
 * Supports both authenticated users and guests (via guestToken).
 */
router.post('/start', optionalAuth, validateStartCheckout, checkoutController.startCheckout);

/**
 * POST /checkout/address
 * Saves shipping and optional billing address for the current checkout session.
 */
router.post('/address', optionalAuth, validateSaveAddress, checkoutController.saveAddress);

/**
 * GET /checkout/review
 * Returns a full checkout summary (items, addresses, totals) before placement.
 */
router.get('/review', optionalAuth, checkoutController.reviewCheckout);

/**
 * POST /checkout/place-order
 * Finalises the order: applies promo, confirms stock, delegates payment intent.
 */
router.post('/place-order', optionalAuth, validatePlaceOrder, checkoutController.placeOrder);

// ── Design-package aliases ────────────────────────────────────────────────────
// /checkout/initiate maps to /checkout/start
// /checkout/confirm  maps to /checkout/place-order
router.post('/initiate', optionalAuth, validateStartCheckout, checkoutController.startCheckout);
router.post('/confirm', optionalAuth, validatePlaceOrder, checkoutController.placeOrder);

module.exports = router;
