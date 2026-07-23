'use strict';

const { Router } = require('express');
const paymentsController = require('./payments.controller');
const paymentsValidator = require('./payments.validator');
const { validate } = require('../../middleware/validate');

const router = Router();

// POST /payments/initiate
router.post(
  '/initiate',
  paymentsValidator.initiatePayment,
  validate,
  paymentsController.initiatePayment
);

// POST /payments/callback  (provider async notification)
router.post(
  '/callback',
  paymentsValidator.paymentCallback,
  validate,
  paymentsController.handleCallback
);

// POST /payments/webhook  (alias – same handler as callback)
router.post(
  '/webhook',
  paymentsValidator.paymentCallback,
  validate,
  paymentsController.handleCallback
);

// POST /payments/confirm  (buyer-side confirmation step)
router.post(
  '/confirm',
  paymentsValidator.confirmPayment,
  validate,
  paymentsController.confirmPayment
);

// GET /payments/:paymentId
router.get(
  '/:paymentId',
  paymentsValidator.paymentIdParam,
  validate,
  paymentsController.getPayment
);

// POST /payments/:paymentId/retry
router.post(
  '/:paymentId/retry',
  paymentsValidator.paymentIdParam,
  validate,
  paymentsController.retryPayment
);

module.exports = router;
