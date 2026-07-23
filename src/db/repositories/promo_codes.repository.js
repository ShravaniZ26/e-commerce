'use strict';

const knex = require('../knex');

const TABLE = 'promo_codes';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByCode = (code, trx = knex) =>
  trx(TABLE).whereRaw('UPPER(code) = UPPER(?)', [code]).first();

const findActiveByCode = (code, trx = knex) =>
  trx(TABLE)
    .whereRaw('UPPER(code) = UPPER(?)', [code])
    .where({ is_active: true })
    .where('valid_from', '<=', knex.fn.now())
    .where('valid_until', '>=', knex.fn.now())
    .first();

const findAll = ({ limit = 20, offset = 0, is_active, search } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (search) query.whereILike('code', `%${search}%`);
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const count = ({ is_active, search } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (search) query.whereILike('code', `%${search}%`);
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

/**
 * Atomically increments used_count, optionally enforcing usage_limit.
 * Returns number of affected rows (0 if limit reached).
 */
const incrementUsage = (id, trx = knex) =>
  trx(TABLE)
    .where({ id })
    .where((builder) => {
      builder.whereNull('usage_limit').orWhereRaw('used_count < usage_limit');
    })
    .increment('used_count', 1);

const decrementUsage = (id, trx = knex) =>
  trx(TABLE)
    .where({ id })
    .where('used_count', '>', 0)
    .decrement('used_count', 1);

module.exports = {
  findById,
  findByCode,
  findActiveByCode,
  findAll,
  count,
  create,
  update,
  remove,
  incrementUsage,
  decrementUsage,
};
