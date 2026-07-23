'use strict';

const knex = require('../knex');

const TABLE = 'return_requests';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByOrderId = (order_id, trx = knex) =>
  trx(TABLE).where({ order_id }).orderBy('created_at', 'desc');

const findByOrderItemId = (order_item_id, trx = knex) =>
  trx(TABLE).where({ order_item_id }).first();

const findAll = (
  { limit = 20, offset = 0, order_id, status, user_id } = {},
  trx = knex,
) => {
  const query = trx(TABLE);
  if (order_id) query.where({ [`${TABLE}.order_id`]: order_id });
  if (status) {
    if (Array.isArray(status)) query.whereIn(`${TABLE}.status`, status);
    else query.where({ [`${TABLE}.status`]: status });
  }
  if (user_id) {
    query
      .join('orders', 'orders.id', `${TABLE}.order_id`)
      .where({ 'orders.user_id': user_id })
      .select(`${TABLE}.*`);
  }
  return query.limit(limit).offset(offset).orderBy(`${TABLE}.created_at`, 'desc');
};

const count = ({ order_id, status, user_id } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (order_id) query.where({ [`${TABLE}.order_id`]: order_id });
  if (status) {
    if (Array.isArray(status)) query.whereIn(`${TABLE}.status`, status);
    else query.where({ [`${TABLE}.status`]: status });
  }
  if (user_id) {
    query.join('orders', 'orders.id', `${TABLE}.order_id`).where({ 'orders.user_id': user_id });
  }
  return query.count(`${TABLE}.id as count`).then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status, notes, trx = knex) => {
  const payload = { status };
  if (notes !== undefined) payload.notes = notes;
  return trx(TABLE).where({ id }).update(payload).returning('*').then((rows) => rows[0]);
};

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

module.exports = {
  findById,
  findByOrderId,
  findByOrderItemId,
  findAll,
  count,
  create,
  update,
  updateStatus,
  remove,
};
