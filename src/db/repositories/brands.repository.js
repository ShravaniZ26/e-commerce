'use strict';

const knex = require('../knex');

const TABLE = 'brands';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findBySlug = (slug, trx = knex) =>
  trx(TABLE).where({ slug }).first();

const findByName = (name, trx = knex) =>
  trx(TABLE).where({ name }).first();

const findAll = ({ limit = 50, offset = 0, is_active, search } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (search) query.whereILike('name', `%${search}%`);
  return query.limit(limit).offset(offset).orderBy('name', 'asc');
};

const count = ({ is_active, search } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (search) query.whereILike('name', `%${search}%`);
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

module.exports = {
  findById,
  findBySlug,
  findByName,
  findAll,
  count,
  create,
  update,
  remove,
};
