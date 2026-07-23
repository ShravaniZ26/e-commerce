'use strict';

const db = require('../../db');
const { AppError } = require('../../utils/errors');

const RETURN_WINDOW_DAYS = 30;

async function checkReturnEligibility(orderId, userId) {
  const orderResult = await db.query(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  );

  const order = orderResult.rows[0];
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status !== 'delivered') {
    throw new AppError('Only delivered orders are eligible for return', 400);
  }

  const deliveredAt = new Date(order.delivered_at);
  const diffMs = Date.now() - deliveredAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > RETURN_WINDOW_DAYS) {
    throw new AppError('Return window of 30 days has expired', 400);
  }

  const existingResult = await db.query(
    `SELECT id FROM return_requests WHERE order_id = $1 AND status IN ('pending', 'approved')`,
    [orderId]
  );

  if (existingResult.rows[0]) {
    throw new AppError('An active return request already exists for this order', 409);
  }

  return order;
}

async function createReturnRequest(orderId, userId, payload) {
  await checkReturnEligibility(orderId, userId);

  const { reason, items } = payload;

  const result = await db.query(
    `INSERT INTO return_requests
       (order_id, user_id, reason, items, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
     RETURNING *`,
    [orderId, userId, reason, JSON.stringify(items)]
  );

  return result.rows[0];
}

async function getReturnRequestByOrderAndId(orderId, returnRequestId, userId) {
  const result = await db.query(
    `SELECT rr.*
     FROM return_requests rr
     JOIN orders o ON o.id = rr.order_id
     WHERE rr.id = $1
       AND rr.order_id = $2
       AND o.user_id = $3`,
    [returnRequestId, orderId, userId]
  );

  if (!result.rows[0]) {
    throw new AppError('Return request not found', 404);
  }

  return result.rows[0];
}

async function listReturnRequests({ page = 1, limit = 20, status } = {}) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`rr.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(parsedLimit, offset);

  const result = await db.query(
    `SELECT rr.*, COUNT(*) OVER() AS total_count
     FROM return_requests rr
     ${whereClause}
     ORDER BY rr.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const totalCount = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
  const data = result.rows.map(({ total_count, ...row }) => row);

  return {
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / parsedLimit),
    },
  };
}

async function getReturnRequestById(returnRequestId) {
  const result = await db.query(
    'SELECT * FROM return_requests WHERE id = $1',
    [returnRequestId]
  );

  if (!result.rows[0]) {
    throw new AppError('Return request not found', 404);
  }

  return result.rows[0];
}

async function reviewReturnRequest(returnRequestId, adminId, { decision, notes }) {
  const returnRequest = await getReturnRequestById(returnRequestId);

  if (returnRequest.status !== 'pending') {
    throw new AppError('Only pending return requests can be reviewed', 400);
  }

  const newStatus = decision === 'approved' ? 'approved' : 'rejected';

  const updateResult = await db.query(
    `UPDATE return_requests
     SET status = $1,
         reviewed_by = $2,
         review_notes = $3,
         reviewed_at = NOW(),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [newStatus, adminId, notes || null, returnRequestId]
  );

  const updated = updateResult.rows[0];

  if (newStatus === 'approved') {
    await triggerRefund(updated);
    await updateStock(updated);
  }

  return updated;
}

async function triggerRefund(returnRequest) {
  await db.query(
    `INSERT INTO refunds
       (return_request_id, order_id, amount, status, created_at, updated_at)
     SELECT $1, o.id, o.total_amount, 'pending', NOW(), NOW()
     FROM orders o
     WHERE o.id = $2`,
    [returnRequest.id, returnRequest.order_id]
  );

  await db.query(
    `UPDATE orders
     SET status = 'refund_pending', updated_at = NOW()
     WHERE id = $1`,
    [returnRequest.order_id]
  );
}

async function updateStock(returnRequest) {
  const items =
    typeof returnRequest.items === 'string'
      ? JSON.parse(returnRequest.items)
      : returnRequest.items;

  for (const item of items) {
    await db.query(
      `UPDATE products
       SET stock_quantity = stock_quantity + $1,
           updated_at = NOW()
       WHERE id = (
         SELECT product_id FROM order_items WHERE id = $2
       )`,
      [item.quantity, item.orderItemId]
    );
  }
}

module.exports = {
  createReturnRequest,
  getReturnRequestByOrderAndId,
  listReturnRequests,
  getReturnRequestById,
  reviewReturnRequest,
};
