'use strict';

const { body, param } = require('express-validator');

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'];
const SUPPORTED_PAYMENT_METHODS = ['card', 'bank_transfer', 'mobile_money', 'ussd', 'qr'];

/**
 * Validation rules for POST /payments/initiate
 */
const initiatePayment = [
  body('orderId')
    .exists({ checkNull: true })
    .withMessage('orderId is required.')
    .isString()
    .withMessage('orderId must be a string.')
    .notEmpty()
    .withMessage('orderId must not be empty.'),

  body('amount')
    .exists({ checkNull: true })
    .withMessage('amount is required.')
    .isInt({ min: 1 })
    .withMessage('amount must be a positive integer representing the smallest currency unit.'),

  body('currency')
    .exists({ checkNull: true })
    .withMessage('currency is required.')
    .isString()
    .withMessage('currency must be a string.')
    .toUpperCase()
    .isIn(SUPPORTED_CURRENCIES)
    .withMessage(`currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}.`),

  body('paymentMethod')
    .exists({ checkNull: true })
    .withMessage('paymentMethod is required.')
    .isString()
    .withMessage('paymentMethod must be a string.')
    .isIn(SUPPORTED_PAYMENT_METHODS)
    .withMessage(`paymentMethod must be one of: ${SUPPORTED_PAYMENT_METHODS.join(', ')}.`),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('metadata must be an object.'),
];

/**
 * Validation rules for POST /payments/callback and POST /payments/webhook
 */
const paymentCallback = [
  body('provider')
    .exists({ checkNull: true })
    .withMessage('provider is required.')
    .isString()
    .withMessage('provider must be a string.')
    .notEmpty()
    .withMessage('provider must not be empty.'),

  body('reference')
    .exists({ checkNull: true })
    .withMessage('reference is required.')
    .isString()
    .withMessage('reference must be a string.')
    .notEmpty()
    .withMessage('reference must not be empty.'),

  body('status')
    .exists({ checkNull: true })
    .withMessage('status is required.')
    .isString()
    .withMessage('status must be a string.')
    .notEmpty()
    .withMessage('status must not be empty.'),

  body('rawData')
    .optional()
    .isObject()
    .withMessage('rawData must be an object.'),
];

/**
 * Validation rules for POST /payments/confirm
 */
const confirmPayment = [
  body('paymentId')
    .exists({ checkNull: true })
    .withMessage('paymentId is required.')
    .isUUID()
    .withMessage('paymentId must be a valid UUID.'),

  body('confirmationToken')
    .optional()
    .isString()
    .withMessage('confirmationToken must be a string.')
    .notEmpty()
    .withMessage('confirmationToken must not be empty.'),
];

/**
 * Validation rules for route params that include :paymentId
 * Used by GET /payments/:paymentId and POST /payments/:paymentId/retry
 */
const paymentIdParam = [
  param('paymentId')
    .exists({ checkNull: true })
    .withMessage('paymentId path parameter is required.')
    .isUUID()
    .withMessage('paymentId must be a valid UUID.'),
];

module.exports = {
  initiatePayment,
  paymentCallback,
  confirmPayment,
  paymentIdParam,
};
