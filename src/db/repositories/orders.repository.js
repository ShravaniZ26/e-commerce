'use strict';

const knex = require('../knex');

const ORDERS_TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const HISTORY_TABLE = 'order_status_history';
const TRACKING_TABLE = 'order_tracking';

// ── Orders ────────────────────────────────────────────────────────────────────

const findById = (id, trx = knex) =>
  trx(ORDERS_TABLE).where({ id }).first();

const findByIdAndUser = (id, user_id, trx = knex) =>
  trx(ORDERS_TABLE).where({ id, user_id }).first();

const findAll = (
  { limit = 20, offset = 0, user_id, status, search } = {},
  trx = knex,
) => {
  const query = trx(ORDERS_TABLE);
  if (user_id) query.where({ user_id });
  if (status) {
    if (Array.isArray(status)) query.whereIn('status', status);
    else query.where({ status });
  }
  if (search) query.whereILike('id::text', `%${search}%`);
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const count = ({ user_id, status, search } = {}, trx = knex) => {
  const query = trx(ORDERS_TABLE);
  if (user_id) query.where({ user_id });
  if (status) {
    if (Array.isArray(status)) query.whereIn('status', status);
    else query.where({ status });
  }
  if (search) query.whereILike('id::text', `%${search}%`);
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(ORDERS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(ORDERS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const updateStatus = (id, status, trx = knex) =>
  trx(ORDERS_TABLE).where({ id }).update({ status }).returning('*').then((rows) => rows[0]);

// ── Order Items ───────────────────────────────────────────────────────────────

const findItemsForOrder = (order_id, trx = knex) =>
  trx(ITEMS_TABLE)
    .join('skus', 'skus.id', `${ITEMS_TABLE}.sku_id`)
    .join('products', 'products.id', 'skus.product_id')
    .where({ order_id })
    .select(
      `${ITEMS_TABLE}.*`,
      'skus.sku_code',
      'skus.attributes as sku_attributes',
      'products.name as product_name',
      'products.slug as product_slug',
    )
    .orderBy(`${ITEMS_TABLE}.id`, 'asc');

const findItemById = (id, trx = knex) =>
  trx(ITEMS_TABLE).where({ id }).first();

const insertItems = (items, trx = knex) =>
  trx(ITEMS_TABLE).insert(items).returning('*');

// ── Order Status History ──────────────────────────────────────────────────────

const findStatusHistory = (order_id, trx = knex) =>
  trx(HISTORY_TABLE).where({ order_id }).orderBy('created_at', 'asc');

const addStatusHistory = (data, trx = knex) =>
  trx(HISTORY_TABLE).insert(data).returning('*').then((rows) => rows[0]);

// ── Order Tracking ────────────────────────────────────────────────────────────

const findTrackingForOrder = (order_id, trx = knex) =>
  trx(TRACKING_TABLE).where({ order_id }).orderBy('created_at', 'desc').first();

const findTrackingById = (id, trx = knex) =>
  trx(TRACKING_TABLE).where({ id }).first();

const upsertTracking = (order_id, data, trx = knex) =>
  trx(TRACKING_TABLE)
    .insert({ order_id, ...data })
    .onConflict('order_id')
    .merge()
    .returning('*')
    .then((rows) => rows[0]);

const updateTracking = (id, data, trx = knex) =>
  trx(TRACKING_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

module.exports = {
  findById,
  findByIdAndUser,
  findAll,
  count,
  create,
  update,
  updateStatus,
  findItemsForOrder,
  findItemById,
  insertItems,
  findStatusHistory,
  addStatusHistory,
  findTrackingForOrder,
  findTrackingById,
  upsertTracking,
  updateTracking,
};
