'use strict';

const express = require('express');
const router = express.Router();
const returnsController = require('./returns.controller');
const returnsValidator = require('./returns.validator');
const { authenticate, requireAdmin } = require('../../middleware/auth');

// Customer routes — mounted relative to app root
router.post(
  '/orders/:id/returns',
  authenticate,
  returnsValidator.createReturnRequestSchema,
  returnsController.initiateReturn
);

router.get(
  '/orders/:id/returns/:rid',
  authenticate,
  returnsController.getReturnRequest
);

// Admin routes
router.get(
  '/return-requests',
  authenticate,
  requireAdmin,
  returnsValidator.listReturnRequestsSchema,
  returnsController.listReturnRequests
);

router.get(
  '/return-requests/:returnRequestId',
  authenticate,
  requireAdmin,
  returnsController.getReturnRequestAdmin
);

router.post(
  '/return-requests/:returnRequestId/review',
  authenticate,
  requireAdmin,
  returnsValidator.reviewReturnRequestSchema,
  returnsController.reviewReturnRequest
);

module.exports = router;
