'use strict';

const knex = require('../knex');

const TABLE = 'users';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByEmail = (email, trx = knex) =>
  trx(TABLE).where({ email }).first();

const findByPhone = (phone, trx = knex) =>
  trx(TABLE).where({ phone }).first();

const findAll = ({ limit = 20, offset = 0, is_active, search } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (search) {
    query.where((builder) => {
      builder
        .whereILike('email', `%${search}%`)
        .orWhereILike('first_name', `%${search}%`)
        .orWhereILike('last_name', `%${search}%`);
    });
  }
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const count = ({ is_active, search } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (search) {
    query.where((builder) => {
      builder
        .whereILike('email', `%${search}%`)
        .orWhereILike('first_name', `%${search}%`)
        .orWhereILike('last_name', `%${search}%`);
    });
  }
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

const setVerified = (id, trx = knex) =>
  trx(TABLE).where({ id }).update({ is_verified: true }).returning('*').then((rows) => rows[0]);

const setActive = (id, is_active, trx = knex) =>
  trx(TABLE).where({ id }).update({ is_active }).returning('*').then((rows) => rows[0]);

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  findAll,
  count,
  create,
  update,
  remove,
  setVerified,
  setActive,
};
