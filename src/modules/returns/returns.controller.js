'use strict';

const { validationResult } = require('express-validator');
const returnsService = require('./returns.service');

function extractValidationErrors(req, res) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(422).json({
      status: 'error',
      message: result.array()[0].msg,
      errors: result.array(),
    });
    return true;
  }
  return false;
}

async function initiateReturn(req, res, next) {
  try {
    if (extractValidationErrors(req, res)) return;
    const orderId = req.params.id;
    const userId = req.user.id;
    const returnRequest = await returnsService.createReturnRequest(orderId, userId, req.body);
    res.status(201).json({ status: 'success', data: returnRequest });
  } catch (err) {
    next(err);
  }
}

async function getReturnRequest(req, res, next) {
  try {
    const orderId = req.params.id;
    const returnRequestId = req.params.rid;
    const userId = req.user.id;
    const returnRequest = await returnsService.getReturnRequestByOrderAndId(
      orderId,
      returnRequestId,
      userId
    );
    res.status(200).json({ status: 'success', data: returnRequest });
  } catch (err) {
    next(err);
  }
}

async function listReturnRequests(req, res, next) {
  try {
    if (extractValidationErrors(req, res)) return;
    const { page, limit, status } = req.query;
    const result = await returnsService.listReturnRequests({ page, limit, status });
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    next(err);
  }
}

async function getReturnRequestAdmin(req, res, next) {
  try {
    const { returnRequestId } = req.params;
    const returnRequest = await returnsService.getReturnRequestById(returnRequestId);
    res.status(200).json({ status: 'success', data: returnRequest });
  } catch (err) {
    next(err);
  }
}

async function reviewReturnRequest(req, res, next) {
  try {
    if (extractValidationErrors(req, res)) return;
    const { returnRequestId } = req.params;
    const adminId = req.user.id;
    const returnRequest = await returnsService.reviewReturnRequest(
      returnRequestId,
      adminId,
      req.body
    );
    res.status(200).json({ status: 'success', data: returnRequest });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiateReturn,
  getReturnRequest,
  listReturnRequests,
  getReturnRequestAdmin,
  reviewReturnRequest,
};
