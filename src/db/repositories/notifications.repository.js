'use strict';

const knex = require('../knex');

const TABLE = 'notifications';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findByIdAndUser = (id, user_id, trx = knex) =>
  trx(TABLE).where({ id, user_id }).first();

const findAllForUser = (
  user_id,
  { limit = 20, offset = 0, is_read, type } = {},
  trx = knex,
) => {
  const query = trx(TABLE).where({ user_id });
  if (typeof is_read === 'boolean') query.where({ is_read });
  if (type) query.where({ type });
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const countForUser = (user_id, { is_read, type } = {}, trx = knex) => {
  const query = trx(TABLE).where({ user_id });
  if (typeof is_read === 'boolean') query.where({ is_read });
  if (type) query.where({ type });
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const countUnreadForUser = (user_id, trx = knex) =>
  trx(TABLE).where({ user_id, is_read: false }).count('id as count').then((rows) => parseInt(rows[0].count, 10));

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const bulkCreate = (records, trx = knex) =>
  trx(TABLE).insert(records).returning('*');

const markAsRead = (id, user_id, trx = knex) =>
  trx(TABLE).where({ id, user_id }).update({ is_read: true }).returning('*').then((rows) => rows[0]);

const markAllAsReadForUser = (user_id, trx = knex) =>
  trx(TABLE).where({ user_id, is_read: false }).update({ is_read: true });

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

const removeAllForUser = (user_id, trx = knex) =>
  trx(TABLE).where({ user_id }).delete();

const findAll = ({ limit = 50, offset = 0, user_id, type, is_read } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (user_id) query.where({ user_id });
  if (type) query.where({ type });
  if (typeof is_read === 'boolean') query.where({ is_read });
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

module.exports = {
  findById,
  findByIdAndUser,
  findAllForUser,
  countForUser,
  countUnreadForUser,
  create,
  bulkCreate,
  markAsRead,
  markAllAsReadForUser,
  remove,
  removeAllForUser,
  findAll,
};
