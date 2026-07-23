'use strict';

const knex = require('../knex');

const TABLE = 'stock_reservations';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByOrderId = (order_id, trx = knex) =>
  trx(TABLE).where({ order_id });

const findBySkuId = (sku_id, trx = knex) =>
  trx(TABLE).where({ sku_id });

const findActiveBySkuId = (sku_id, trx = knex) =>
  trx(TABLE).where({ sku_id, status: 'active' }).where('expires_at', '>', knex.fn.now());

const findExpired = (trx = knex) =>
  trx(TABLE).where({ status: 'active' }).where('expires_at', '<=', knex.fn.now());

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const bulkCreate = (records, trx = knex) =>
  trx(TABLE).insert(records).returning('*');

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const confirm = (id, trx = knex) =>
  trx(TABLE).where({ id }).update({ status: 'confirmed' }).returning('*').then((rows) => rows[0]);

const cancel = (id, trx = knex) =>
  trx(TABLE).where({ id }).update({ status: 'cancelled' }).returning('*').then((rows) => rows[0]);

const cancelByOrderId = (order_id, trx = knex) =>
  trx(TABLE).where({ order_id, status: 'active' }).update({ status: 'cancelled' }).returning('*');

const confirmByOrderId = (order_id, trx = knex) =>
  trx(TABLE).where({ order_id, status: 'active' }).update({ status: 'confirmed' }).returning('*');

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

/**
 * Sum reserved quantity for a SKU (active reservations not expired).
 */
const sumActiveReservedQuantity = (sku_id, trx = knex) =>
  trx(TABLE)
    .where({ sku_id, status: 'active' })
    .where('expires_at', '>', knex.fn.now())
    .sum('quantity as total')
    .then((rows) => parseInt(rows[0].total || 0, 10));

module.exports = {
  findById,
  findByOrderId,
  findBySkuId,
  findActiveBySkuId,
  findExpired,
  create,
  bulkCreate,
  update,
  confirm,
  cancel,
  cancelByOrderId,
  confirmByOrderId,
  remove,
  sumActiveReservedQuantity,
};
