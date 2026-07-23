'use strict';

const knex = require('../knex');

const TABLE = 'refunds';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByOrderId = (order_id, trx = knex) =>
  trx(TABLE).where({ order_id }).orderBy('created_at', 'desc');

const findByPaymentAttemptId = (payment_attempt_id, trx = knex) =>
  trx(TABLE).where({ payment_attempt_id }).orderBy('created_at', 'desc');

const findByGatewayRefundId = (gateway_refund_id, trx = knex) =>
  trx(TABLE).where({ gateway_refund_id }).first();

const findAll = ({ limit = 20, offset = 0, order_id, status } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (order_id) query.where({ order_id });
  if (status) query.where({ status });
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const count = ({ order_id, status } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (order_id) query.where({ order_id });
  if (status) query.where({ status });
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status, trx = knex) =>
  trx(TABLE).where({ id }).update({ status }).returning('*').then((rows) => rows[0]);

const sumRefundedForOrder = (order_id, trx = knex) =>
  trx(TABLE)
    .where({ order_id })
    .whereIn('status', ['succeeded', 'processed'])
    .sum('amount as total')
    .then((rows) => parseFloat(rows[0].total || 0));

module.exports = {
  findById,
  findByOrderId,
  findByPaymentAttemptId,
  findByGatewayRefundId,
  findAll,
  count,
  create,
  update,
  updateStatus,
  sumRefundedForOrder,
};
