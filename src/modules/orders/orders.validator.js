'use strict';

const { body, validationResult } = require('express-validator');

const VALID_ADVANCE_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
}

/**
 * POST /orders/:orderId/advance
 */
const validateAdvanceOrder = [
  body('status')
    .exists({ checkNull: true })
    .withMessage('Status is required')
    .isString()
    .withMessage('Status must be a string')
    .isIn(VALID_ADVANCE_STATUSES)
    .withMessage(
      `Status must be one of: ${VALID_ADVANCE_STATUSES.join(', ')}`,
    ),
  body('note')
    .optional({ nullable: true })
    .isString()
    .withMessage('Note must be a string')
    .isLength({ max: 1000 })
    .withMessage('Note must not exceed 1000 characters'),
  handleValidationErrors,
];

/**
 * POST /orders/:orderId/cancel
 */
const validateCancelOrder = [
  body('reason')
    .optional({ nullable: true })
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters'),
  handleValidationErrors,
];

/**
 * POST /orders/:orderId/return-requests
 */
const validateReturnRequest = [
  body('reason')
    .exists({ checkNull: true })
    .withMessage('Reason is required')
    .isString()
    .withMessage('Reason must be a string')
    .notEmpty()
    .withMessage('Reason must not be empty')
    .isLength({ max: 2000 })
    .withMessage('Reason must not exceed 2000 characters'),
  body('items')
    .exists({ checkNull: true })
    .withMessage('Items are required')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.orderItemId')
    .exists({ checkNull: true })
    .withMessage('Order item ID is required')
    .notEmpty()
    .withMessage('Order item ID must not be empty'),
  body('items.*.quantity')
    .exists({ checkNull: true })
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  handleValidationErrors,
];

module.exports = {
  validateAdvanceOrder,
  validateCancelOrder,
  validateReturnRequest,
};
