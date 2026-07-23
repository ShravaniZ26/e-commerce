'use strict';

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware: extract express-validator errors and short-circuit with 422.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * Schema: validate a promo code against an order.
 */
const validatePromoCodeSchema = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Promo code is required')
    .isString()
    .withMessage('Promo code must be a string')
    .isLength({ min: 3, max: 50 })
    .withMessage('Promo code must be between 3 and 50 characters'),
  body('orderAmount')
    .notEmpty()
    .withMessage('Order amount is required')
    .isFloat({ min: 0 })
    .withMessage('Order amount must be a non-negative number'),
  body('userId')
    .optional({ nullable: true })
    .isString()
    .withMessage('User ID must be a string'),
];

/**
 * Schema: create a new promo code (admin).
 */
const createPromoCodeSchema = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Promo code is required')
    .isString()
    .withMessage('Promo code must be a string')
    .isLength({ min: 3, max: 50 })
    .withMessage('Promo code must be between 3 and 50 characters')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Promo code may only contain letters, numbers, underscores, and hyphens'),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be "percentage" or "fixed"'),
  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number'),
  body('minOrderAmount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number'),
  body('maxUses')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
  body('startDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('applicableCategories')
    .optional()
    .isArray()
    .withMessage('Applicable categories must be an array'),
  body('applicableCategories.*')
    .optional()
    .isString()
    .withMessage('Each applicable category must be a string'),
];

/**
 * Schema: update an existing promo code (admin, all fields optional).
 */
const updatePromoCodeSchema = [
  param('id')
    .notEmpty()
    .withMessage('Promo code ID is required'),
  body('code')
    .optional()
    .trim()
    .isString()
    .withMessage('Promo code must be a string')
    .isLength({ min: 3, max: 50 })
    .withMessage('Promo code must be between 3 and 50 characters')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Promo code may only contain letters, numbers, underscores, and hyphens'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be "percentage" or "fixed"'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a non-negative number'),
  body('minOrderAmount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number'),
  body('maxUses')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
  body('startDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('applicableCategories')
    .optional()
    .isArray()
    .withMessage('Applicable categories must be an array'),
  body('applicableCategories.*')
    .optional()
    .isString()
    .withMessage('Each applicable category must be a string'),
];

/**
 * Schema: list query parameters (admin).
 */
const listPromoCodesSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive filter must be a boolean value'),
];

module.exports = {
  handleValidationErrors,
  validatePromoCodeSchema,
  createPromoCodeSchema,
  updatePromoCodeSchema,
  listPromoCodesSchema,
};
