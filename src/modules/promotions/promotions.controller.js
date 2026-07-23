'use strict';

const promotionsService = require('./promotions.service');
const { PromotionError } = require('./promotions.service');

/**
 * Centralised error response helper.
 * Falls back to 500 for unexpected errors.
 */
function _sendError(res, err) {
  if (err instanceof PromotionError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

// ---------------------------------------------------------------------------
// Public endpoint
// ---------------------------------------------------------------------------

/**
 * POST /validate
 * Validate a promo code against the provided order amount.
 */
async function validatePromo(req, res, next) {
  try {
    const { code, orderAmount, userId } = req.body;
    const result = await promotionsService.validatePromoCode(
      code,
      Number(orderAmount),
      userId,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return _sendError(res, err);
  }
}

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

/**
 * GET /admin/promo-codes
 * Return a paginated list of all promo codes.
 */
async function getAllPromoCodes(req, res, next) {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const result = await promotionsService.getAllPromoCodes({ page, limit, isActive });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return _sendError(res, err);
  }
}

/**
 * GET /admin/promo-codes/:id
 * Return a single promo code by ID.
 */
async function getPromoCodeById(req, res, next) {
  try {
    const { id } = req.params;
    const promo = await promotionsService.getPromoCodeById(id);
    return res.status(200).json({ success: true, data: promo });
  } catch (err) {
    return _sendError(res, err);
  }
}

/**
 * POST /admin/promo-codes
 * Create a new promo code.
 */
async function createPromoCode(req, res, next) {
  try {
    const promo = await promotionsService.createPromoCode(req.body);
    return res.status(201).json({ success: true, data: promo });
  } catch (err) {
    return _sendError(res, err);
  }
}

/**
 * PUT /admin/promo-codes/:id
 * Update an existing promo code.
 */
async function updatePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const promo = await promotionsService.updatePromoCode(id, req.body);
    return res.status(200).json({ success: true, data: promo });
  } catch (err) {
    return _sendError(res, err);
  }
}

/**
 * DELETE /admin/promo-codes/:id
 * Remove a promo code.
 */
async function deletePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const result = await promotionsService.deletePromoCode(id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return _sendError(res, err);
  }
}

/**
 * POST /admin/promo-codes/:id/track-usage
 * Increment the usage counter for a promo code after a successful order.
 * Intended for internal / service-to-service calls.
 */
async function trackUsage(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const result = await promotionsService.trackUsage(id, userId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return _sendError(res, err);
  }
}

module.exports = {
  validatePromo,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  trackUsage,
};
