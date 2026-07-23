'use strict';

const { body, param, query } = require('express-validator');

const createReturnRequestSchema = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),

  body('items.*.orderItemId')
    .notEmpty()
    .withMessage('Order item ID is required for each item'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const reviewReturnRequestSchema = [
  param('returnRequestId')
    .notEmpty()
    .withMessage('Return request ID is required'),

  body('decision')
    .notEmpty()
    .withMessage('Decision is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Decision must be either approved or rejected'),

  body('notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

const listReturnRequestsSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: pending, approved, rejected'),
];

module.exports = {
  createReturnRequestSchema,
  reviewReturnRequestSchema,
  listReturnRequestsSchema,
};
