'use strict';

const db = require('../../db');

// Valid forward transitions for each status
const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const CANCELLABLE_STATUSES = new Set(['pending', 'confirmed']);

function makeError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

async function listOrders({ userId, page = 1, limit = 20, status } = {}) {
  const offset = (page - 1) * limit;

  const query = db('orders').orderBy('created_at', 'desc').limit(limit).offset(offset);
  const countQuery = db('orders').count('id as total');

  if (userId !== undefined && userId !== null) {
    query.where('user_id', userId);
    countQuery.where('user_id', userId);
  }

  if (status) {
    query.where('status', status);
    countQuery.where('status', status);
  }

  const [orders, [{ total }]] = await Promise.all([query, countQuery]);
  const totalInt = parseInt(total, 10);

  return {
    data: orders,
    meta: {
      total: totalInt,
      page,
      limit,
      totalPages: Math.ceil(totalInt / limit),
    },
  };
}

async function getOrderById(orderId, userId = null) {
  const query = db('orders').where('id', orderId);

  if (userId !== null) {
    query.where('user_id', userId);
  }

  const order = await query.first();

  if (!order) {
    throw makeError('Order not found', 404);
  }

  return order;
}

async function getOrderRefunds(orderId, userId = null) {
  await getOrderById(orderId, userId);

  return db('refunds').where('order_id', orderId).orderBy('created_at', 'desc');
}

async function getOrderTimeline(orderId, userId = null) {
  await getOrderById(orderId, userId);

  return db('order_status_history')
    .where('order_id', orderId)
    .orderBy('created_at', 'asc');
}

async function getOrderTracking(orderId, userId = null) {
  await getOrderById(orderId, userId);

  const tracking = await db('order_tracking').where('order_id', orderId).first();

  if (!tracking) {
    throw makeError('Tracking information not found for this order', 404);
  }

  return tracking;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

async function advanceOrder(orderId, targetStatus, note = null) {
  const order = await getOrderById(orderId);
  const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];

  if (!allowed.includes(targetStatus)) {
    throw makeError(
      `Cannot transition order from "${order.status}" to "${targetStatus}"`,
      422,
    );
  }

  return db.transaction(async (trx) => {
    const rows = await trx('orders')
      .where('id', orderId)
      .update({ status: targetStatus, updated_at: new Date() })
      .returning('*');

    await trx('order_status_history').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: targetStatus,
      note: note || null,
      created_at: new Date(),
    });

    return rows[0] || { ...order, status: targetStatus };
  });
}

async function cancelOrder(orderId, reason = null, userId = null) {
  const order = await getOrderById(orderId, userId);

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    throw makeError(
      `Order cannot be cancelled in its current status "${order.status}"`,
      409,
    );
  }

  return db.transaction(async (trx) => {
    const rows = await trx('orders')
      .where('id', orderId)
      .update({ status: 'cancelled', updated_at: new Date() })
      .returning('*');

    await trx('order_status_history').insert({
      order_id: orderId,
      from_status: order.status,
      to_status: 'cancelled',
      note: reason || null,
      created_at: new Date(),
    });

    return rows[0] || { ...order, status: 'cancelled' };
  });
}

async function createReturnRequest(orderId, { reason, items }, userId = null) {
  const order = await getOrderById(orderId, userId);

  if (order.status !== 'delivered') {
    throw makeError('Return requests can only be submitted for delivered orders', 422);
  }

  const existing = await db('return_requests')
    .where({ order_id: orderId })
    .whereIn('status', ['pending', 'approved'])
    .first();

  if (existing) {
    throw makeError('An active return request already exists for this order', 409);
  }

  const rows = await db('return_requests')
    .insert({
      order_id: orderId,
      user_id: userId,
      reason,
      items: JSON.stringify(items),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('*');

  return rows[0];
}

/**
 * createOrder — called by the checkout module after payment confirmation.
 * Wraps insert + order_items + initial status history in a transaction.
 */
async function createOrder({ userId, totalAmount, shippingAddress, items = [] }) {
  return db.transaction(async (trx) => {
    const orderRows = await trx('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total_amount: totalAmount,
        shipping_address: JSON.stringify(shippingAddress),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    const order = orderRows[0];

    if (items.length > 0) {
      await trx('order_items').insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          created_at: new Date(),
        })),
      );
    }

    await trx('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      note: 'Order created',
      created_at: new Date(),
    });

    return order;
  });
}

module.exports = {
  listOrders,
  getOrderById,
  getOrderRefunds,
  getOrderTimeline,
  getOrderTracking,
  advanceOrder,
  cancelOrder,
  createReturnRequest,
  createOrder,
};
