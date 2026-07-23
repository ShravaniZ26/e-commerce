'use strict';

const knex = require('../knex');

const TABLE = 'serviceable_pin_codes';

const findByPinCode = (pin_code, trx = knex) =>
  trx(TABLE).where({ pin_code }).first();

const isServiceable = (pin_code, trx = knex) =>
  trx(TABLE)
    .where({ pin_code, is_active: true })
    .first()
    .then((row) => Boolean(row));

const findAll = ({ limit = 50, offset = 0, is_active, city, state } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (city) query.whereILike('city', `%${city}%`);
  if (state) query.whereILike('state', `%${state}%`);
  return query.limit(limit).offset(offset).orderBy('pin_code', 'asc');
};

const count = ({ is_active, city, state } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (city) query.whereILike('city', `%${city}%`);
  if (state) query.whereILike('state', `%${state}%`);
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const upsert = (data, trx = knex) =>
  trx(TABLE)
    .insert(data)
    .onConflict('pin_code')
    .merge()
    .returning('*')
    .then((rows) => rows[0]);

const bulkUpsert = (records, trx = knex) =>
  trx(TABLE)
    .insert(records)
    .onConflict('pin_code')
    .merge()
    .returning('*');

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

const setActive = (pin_code, is_active, trx = knex) =>
  trx(TABLE).where({ pin_code }).update({ is_active }).returning('*').then((rows) => rows[0]);

module.exports = {
  findByPinCode,
  isServiceable,
  findAll,
  count,
  create,
  upsert,
  bulkUpsert,
  update,
  remove,
  setActive,
};
