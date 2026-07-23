'use strict';

const paymentsService = require('./payments.service');
const { HTTP_STATUS } = require('../../constants/httpStatus');

/**
 * POST /payments/initiate
 * Kicks off a new payment attempt for an order.
 */
async function initiatePayment(req, res, next) {
  try {
    const payment = await paymentsService.initiatePayment(req.body);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/callback  (also mapped to /payments/webhook)
 * Receives an asynchronous status notification from the payment provider.
 */
async function handleCallback(req, res, next) {
  try {
    const result = await paymentsService.handleCallback(req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/confirm
 * Confirms a pending payment on the buyer side.
 */
async function confirmPayment(req, res, next) {
  try {
    const result = await paymentsService.confirmPayment(req.body);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/:paymentId
 * Retrieves the current state of a payment attempt.
 */
async function getPayment(req, res, next) {
  try {
    const payment = await paymentsService.getPayment(req.params.paymentId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/:paymentId/retry
 * Re-submits a failed payment attempt via the active provider adapter.
 */
async function retryPayment(req, res, next) {
  try {
    const payment = await paymentsService.retryPayment(req.params.paymentId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiatePayment,
  handleCallback,
  confirmPayment,
  getPayment,
  retryPayment,
};
