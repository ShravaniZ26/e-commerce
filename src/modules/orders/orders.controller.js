'use strict';

const service = require('./orders.service');

async function listOrders(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const userId = req.user && !req.user.isAdmin ? req.user.id : undefined;

    const result = await service.listOrders({
      userId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
      status,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user && !req.user.isAdmin ? req.user.id : null;

    const order = await service.getOrderById(orderId, userId);
    return res.status(200).json({ data: order });
  } catch (err) {
    next(err);
  }
}

async function getOrderRefunds(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user && !req.user.isAdmin ? req.user.id : null;

    const refunds = await service.getOrderRefunds(orderId, userId);
    return res.status(200).json({ data: refunds });
  } catch (err) {
    next(err);
  }
}

async function getOrderTimeline(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user && !req.user.isAdmin ? req.user.id : null;

    const timeline = await service.getOrderTimeline(orderId, userId);
    return res.status(200).json({ data: timeline });
  } catch (err) {
    next(err);
  }
}

async function getOrderTracking(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user && !req.user.isAdmin ? req.user.id : null;

    const tracking = await service.getOrderTracking(orderId, userId);
    return res.status(200).json({ data: tracking });
  } catch (err) {
    next(err);
  }
}

async function advanceOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await service.advanceOrder(orderId, status, note);
    return res.status(200).json({ data: order });
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user && !req.user.isAdmin ? req.user.id : null;

    const order = await service.cancelOrder(orderId, reason, userId);
    return res.status(200).json({ data: order });
  } catch (err) {
    next(err);
  }
}

async function createReturnRequest(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user ? req.user.id : null;

    const returnRequest = await service.createReturnRequest(orderId, req.body, userId);
    return res.status(201).json({ data: returnRequest });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrders,
  getOrder,
  getOrderRefunds,
  getOrderTimeline,
  getOrderTracking,
  advanceOrder,
  cancelOrder,
  createReturnRequest,
};
