'use strict';

const { Router } = require('express');
const controller = require('./orders.controller');
const {
  validateAdvanceOrder,
  validateCancelOrder,
  validateReturnRequest,
} = require('./orders.validator');

const router = Router();

// Order list and detail
router.get('/', controller.listOrders);
router.get('/:orderId', controller.getOrder);

// Sub-resources
router.get('/:orderId/refunds', controller.getOrderRefunds);
router.get('/:orderId/timeline', controller.getOrderTimeline);
router.get('/:orderId/tracking', controller.getOrderTracking);

// Status mutations
router.post('/:orderId/advance', validateAdvanceOrder, controller.advanceOrder);
router.post('/:orderId/cancel', validateCancelOrder, controller.cancelOrder);
router.post('/:orderId/return-requests', validateReturnRequest, controller.createReturnRequest);

module.exports = router;
