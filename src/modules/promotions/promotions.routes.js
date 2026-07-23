'use strict';

const { Router } = require('express');
const promotionsController = require('./promotions.controller');
const {
  handleValidationErrors,
  validatePromoCodeSchema,
  createPromoCodeSchema,
  updatePromoCodeSchema,
  listPromoCodesSchema,
} = require('./promotions.validator');

const router = Router();

// ---------------------------------------------------------------------------
// Public — promo code validation
// POST /validate
// ---------------------------------------------------------------------------
router.post(
  '/validate',
  validatePromoCodeSchema,
  handleValidationErrors,
  promotionsController.validatePromo,
);

// ---------------------------------------------------------------------------
// Admin — promo code management
// Base path: /admin/promo-codes
// ---------------------------------------------------------------------------

/**
 * GET /admin/promo-codes
 * List all promo codes with optional pagination and filtering.
 */
router.get(
  '/admin/promo-codes',
  listPromoCodesSchema,
  handleValidationErrors,
  promotionsController.getAllPromoCodes,
);

/**
 * POST /admin/promo-codes
 * Create a new promo code.
 */
router.post(
  '/admin/promo-codes',
  createPromoCodeSchema,
  handleValidationErrors,
  promotionsController.createPromoCode,
);

/**
 * GET /admin/promo-codes/:id
 * Retrieve a single promo code by ID.
 */
router.get('/admin/promo-codes/:id', promotionsController.getPromoCodeById);

/**
 * PUT /admin/promo-codes/:id
 * Update an existing promo code.
 */
router.put(
  '/admin/promo-codes/:id',
  updatePromoCodeSchema,
  handleValidationErrors,
  promotionsController.updatePromoCode,
);

/**
 * DELETE /admin/promo-codes/:id
 * Delete a promo code.
 */
router.delete('/admin/promo-codes/:id', promotionsController.deletePromoCode);

/**
 * POST /admin/promo-codes/:id/track-usage
 * Record a usage event after a successful order (internal / service call).
 */
router.post('/admin/promo-codes/:id/track-usage', promotionsController.trackUsage);

module.exports = router;
