'use strict';

const knex = require('../knex');

const TABLE = 'skus';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findBySkuCode = (sku_code, trx = knex) =>
  trx(TABLE).where({ sku_code }).first();

const findForProduct = (product_id, trx = knex) =>
  trx(TABLE).where({ product_id }).orderBy('price', 'asc');

const findActiveForProduct = (product_id, trx = knex) =>
  trx(TABLE).where({ product_id, is_active: true }).orderBy('price', 'asc');

const findAll = ({ limit = 50, offset = 0, is_active, product_id } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (product_id) query.where({ product_id });
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const count = ({ is_active, product_id } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (product_id) query.where({ product_id });
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

/**
 * Atomically decrements stock_quantity by `quantity` only when sufficient stock exists.
 * Returns the number of affected rows (1 on success, 0 if insufficient stock).
 */
const decrementStock = (id, quantity, trx = knex) =>
  trx(TABLE)
    .where({ id, is_active: true })
    .where('stock_quantity', '>=', quantity)
    .decrement('stock_quantity', quantity);

/**
 * Atomically increments stock_quantity (e.g., on cancellation or return).
 */
const incrementStock = (id, quantity, trx = knex) =>
  trx(TABLE).where({ id }).increment('stock_quantity', quantity);

/**
 * Bulk fetch SKUs by IDs.
 */
const findByIds = (ids, trx = knex) =>
  trx(TABLE).whereIn('id', ids);

/**
 * Lock SKU row for update within a transaction (SELECT FOR UPDATE).
 */
const lockForUpdate = (id, trx) =>
  trx(TABLE).where({ id }).forUpdate().first();

const setStock = (id, stock_quantity, trx = knex) =>
  trx(TABLE).where({ id }).update({ stock_quantity }).returning('*').then((rows) => rows[0]);

module.exports = {
  findById,
  findBySkuCode,
  findForProduct,
  findActiveForProduct,
  findAll,
  count,
  create,
  update,
  remove,
  decrementStock,
  incrementStock,
  findByIds,
  lockForUpdate,
  setStock,
};
