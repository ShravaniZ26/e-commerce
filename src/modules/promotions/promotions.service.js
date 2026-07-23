'use strict';

/**
 * Lightweight error class carrying an HTTP status code.
 * The global error handler middleware should read `err.statusCode`.
 */
class PromotionError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'PromotionError';
    this.statusCode = statusCode;
  }
}

/**
 * In-memory promo-code store.
 * Replace _store / _nextId / _findByCode with your database
 * model / repository calls when integrating with a persistence layer.
 */
const _store = new Map();
let _idSeq = 1;

function _nextId() {
  return String(_idSeq++);
}

function _findByCode(code) {
  for (const promo of _store.values()) {
    if (promo.code === code.toUpperCase()) {
      return { ...promo };
    }
  }
  return null;
}

function _isDateExpired(promo) {
  const now = Date.now();
  if (promo.startDate && new Date(promo.startDate).getTime() > now) {
    return true;
  }
  if (promo.endDate && new Date(promo.endDate).getTime() < now) {
    return true;
  }
  return false;
}

function _isUsageLimitReached(promo) {
  if (promo.maxUses == null) return false;
  return promo.usedCount >= promo.maxUses;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a promo code for a given order amount.
 * Checks: existence, active status, date range, usage cap, minimum order.
 *
 * @param {string}  code
 * @param {number}  orderAmount
 * @param {string}  [userId]
 * @returns {Promise<object>} Validation result including computed discount.
 */
async function validatePromoCode(code, orderAmount, userId) {
  const promo = _findByCode(code);

  if (!promo) {
    throw new PromotionError(404, 'Promo code not found');
  }

  if (!promo.isActive) {
    throw new PromotionError(400, 'Promo code is inactive');
  }

  if (_isDateExpired(promo)) {
    throw new PromotionError(400, 'Promo code has expired or is not yet active');
  }

  if (_isUsageLimitReached(promo)) {
    throw new PromotionError(400, 'Promo code usage limit has been reached');
  }

  if (promo.minOrderAmount != null && orderAmount < promo.minOrderAmount) {
    throw new PromotionError(
      400,
      `A minimum order amount of ${promo.minOrderAmount} is required for this promo code`,
    );
  }

  const discount = calculateDiscount(promo, orderAmount);

  return {
    valid: true,
    promoId: promo.id,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discount,
    finalAmount: parseFloat(Math.max(0, orderAmount - discount).toFixed(2)),
  };
}

/**
 * Calculate the discount amount for a given promo and order total.
 * For 'percentage' promos the discount is capped to the order amount.
 *
 * @param {object} promo
 * @param {number} orderAmount
 * @returns {number}
 */
function calculateDiscount(promo, orderAmount) {
  if (promo.discountType === 'percentage') {
    const raw = (promo.discountValue / 100) * orderAmount;
    return parseFloat(Math.min(raw, orderAmount).toFixed(2));
  }
  // fixed — cannot exceed order amount
  return parseFloat(Math.min(promo.discountValue, orderAmount).toFixed(2));
}

/**
 * Increment the usage counter for a promo code after a successful order.
 *
 * @param {string} promoId
 * @param {string} [userId]
 * @returns {Promise<object>}
 */
async function trackUsage(promoId, userId) {
  const promo = _store.get(promoId);
  if (!promo) {
    throw new PromotionError(404, 'Promo code not found');
  }
  promo.usedCount += 1;
  _store.set(promoId, promo);
  return { promoId, usedCount: promo.usedCount };
}

/**
 * Return a paginated list of all promo codes.
 *
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {boolean|string} [options.isActive]
 * @returns {Promise<object>}
 */
async function getAllPromoCodes({ page = 1, limit = 20, isActive } = {}) {
  let items = Array.from(_store.values());

  if (isActive !== undefined && isActive !== null && isActive !== '') {
    const activeFilter = isActive === true || isActive === 'true';
    items = items.filter((p) => p.isActive === activeFilter);
  }

  const total = items.length;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const start = (pageNum - 1) * limitNum;
  const data = items.slice(start, start + limitNum);

  return {
    data,
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum) || 1,
  };
}

/**
 * Return a single promo code by its internal ID.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
async function getPromoCodeById(id) {
  const promo = _store.get(id);
  if (!promo) {
    throw new PromotionError(404, 'Promo code not found');
  }
  return { ...promo };
}

/**
 * Create a new promo code.
 *
 * @param {object} data
 * @returns {Promise<object>} The created promo code.
 */
async function createPromoCode(data) {
  const existing = _findByCode(data.code);
  if (existing) {
    throw new PromotionError(409, 'A promo code with this code already exists');
  }

  const id = _nextId();
  const promo = {
    id,
    code: data.code.toUpperCase(),
    discountType: data.discountType,
    discountValue: Number(data.discountValue),
    minOrderAmount: data.minOrderAmount != null ? Number(data.minOrderAmount) : null,
    maxUses: data.maxUses != null ? Number(data.maxUses) : null,
    usedCount: 0,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    applicableCategories: Array.isArray(data.applicableCategories)
      ? data.applicableCategories
      : [],
  };

  _store.set(id, promo);
  return { ...promo };
}

/**
 * Update fields on an existing promo code.
 *
 * @param {string} id
 * @param {object} data  Partial fields to update.
 * @returns {Promise<object>} The updated promo code.
 */
async function updatePromoCode(id, data) {
  const promo = _store.get(id);
  if (!promo) {
    throw new PromotionError(404, 'Promo code not found');
  }

  if (data.code !== undefined) {
    const normalised = data.code.toUpperCase();
    if (normalised !== promo.code) {
      const conflict = _findByCode(normalised);
      if (conflict) {
        throw new PromotionError(409, 'A promo code with this code already exists');
      }
    }
  }

  const updated = {
    ...promo,
    ...(data.code !== undefined && { code: data.code.toUpperCase() }),
    ...(data.discountType !== undefined && { discountType: data.discountType }),
    ...(data.discountValue !== undefined && { discountValue: Number(data.discountValue) }),
    ...(data.minOrderAmount !== undefined && {
      minOrderAmount: data.minOrderAmount != null ? Number(data.minOrderAmount) : null,
    }),
    ...(data.maxUses !== undefined && {
      maxUses: data.maxUses != null ? Number(data.maxUses) : null,
    }),
    ...(data.startDate !== undefined && { startDate: data.startDate }),
    ...(data.endDate !== undefined && { endDate: data.endDate }),
    ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
    ...(data.applicableCategories !== undefined && {
      applicableCategories: data.applicableCategories,
    }),
  };

  _store.set(id, updated);
  return { ...updated };
}

/**
 * Delete a promo code by ID.
 *
 * @param {string} id
 * @returns {Promise<object>} The deleted ID.
 */
async function deletePromoCode(id) {
  const promo = _store.get(id);
  if (!promo) {
    throw new PromotionError(404, 'Promo code not found');
  }
  _store.delete(id);
  return { id };
}

module.exports = {
  PromotionError,
  validatePromoCode,
  calculateDiscount,
  trackUsage,
  getAllPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
