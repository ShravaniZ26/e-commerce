'use strict';

const knex = require('../knex');

const TABLE = 'payment_attempts';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByOrderId = (order_id, trx = knex) =>
  trx(TABLE).where({ order_id }).orderBy('created_at', 'desc');

const findLatestByOrderId = (order_id, trx = knex) =>
  trx(TABLE).where({ order_id }).orderBy('created_at', 'desc').first();

const findByGatewayOrderId = (payment_gateway, gateway_order_id, trx = knex) =>
  trx(TABLE).where({ payment_gateway, gateway_order_id }).first();

const findByGatewayPaymentId = (payment_gateway, gateway_payment_id, trx = knex) =>
  trx(TABLE).where({ payment_gateway, gateway_payment_id }).first();

const findAll = ({ limit = 20, offset = 0, order_id, status, payment_gateway } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (order_id) query.where({ order_id });
  if (status) query.where({ status });
  if (payment_gateway) query.where({ payment_gateway });
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const count = ({ order_id, status, payment_gateway } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (order_id) query.where({ order_id });
  if (status) query.where({ status });
  if (payment_gateway) query.where({ payment_gateway });
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status, gateway_response, trx = knex) => {
  const payload = { status };
  if (gateway_response !== undefined) payload.gateway_response = gateway_response;
  return trx(TABLE).where({ id }).update(payload).returning('*').then((rows) => rows[0]);
};

const updateByGatewayPaymentId = (payment_gateway, gateway_payment_id, data, trx = knex) =>
  trx(TABLE).where({ payment_gateway, gateway_payment_id }).update(data).returning('*').then((rows) => rows[0]);

module.exports = {
  findById,
  findByOrderId,
  findLatestByOrderId,
  findByGatewayOrderId,
  findByGatewayPaymentId,
  findAll,
  count,
  create,
  update,
  updateStatus,
  updateByGatewayPaymentId,
};
