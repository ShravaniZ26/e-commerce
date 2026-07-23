'use strict';

const knex = require('../knex');

const TABLE = 'addresses';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByIdAndUser = (id, user_id, trx = knex) =>
  trx(TABLE).where({ id, user_id }).first();

const findAllForUser = (user_id, trx = knex) =>
  trx(TABLE).where({ user_id }).orderBy('is_default', 'desc').orderBy('created_at', 'desc');

const findDefaultForUser = (user_id, trx = knex) =>
  trx(TABLE).where({ user_id, is_default: true }).first();

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

const clearDefaultForUser = (user_id, trx = knex) =>
  trx(TABLE).where({ user_id, is_default: true }).update({ is_default: false });

const setDefault = async (id, user_id, trx = knex) => {
  const useTransaction = trx === knex;
  const execute = async (t) => {
    await clearDefaultForUser(user_id, t);
    return t(TABLE).where({ id, user_id }).update({ is_default: true }).returning('*').then((rows) => rows[0]);
  };
  if (useTransaction) return knex.transaction(execute);
  return execute(trx);
};

const countForUser = (user_id, trx = knex) =>
  trx(TABLE).where({ user_id }).count('id as count').then((rows) => parseInt(rows[0].count, 10));

module.exports = {
  findById,
  findByIdAndUser,
  findAllForUser,
  findDefaultForUser,
  create,
  update,
  remove,
  clearDefaultForUser,
  setDefault,
  countForUser,
};
