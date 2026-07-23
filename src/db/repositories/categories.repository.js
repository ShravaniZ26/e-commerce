'use strict';

const knex = require('../knex');

const TABLE = 'categories';

const findById = (id, trx = knex) =>
  trx(TABLE).where({ id }).first();

const findBySlug = (slug, trx = knex) =>
  trx(TABLE).where({ slug }).first();

const findRootCategories = (trx = knex) =>
  trx(TABLE).whereNull('parent_id').where({ is_active: true }).orderBy('sort_order', 'asc');

const findDirectChildren = (parent_id, trx = knex) =>
  trx(TABLE).where({ parent_id, is_active: true }).orderBy('sort_order', 'asc');

const findAll = ({ limit = 100, offset = 0, is_active, parent_id } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (parent_id !== undefined) {
    if (parent_id === null) query.whereNull('parent_id');
    else query.where({ parent_id });
  }
  return query.limit(limit).offset(offset).orderBy('sort_order', 'asc');
};

const count = ({ is_active, parent_id } = {}, trx = knex) => {
  const query = trx(TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (parent_id !== undefined) {
    if (parent_id === null) query.whereNull('parent_id');
    else query.where({ parent_id });
  }
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(TABLE).where({ id }).delete();

/**
 * Returns all descendants of a category using a recursive CTE (PostgreSQL).
 * Excludes the root category itself.
 */
const getDescendants = (categoryId, trx = knex) =>
  (trx || knex).raw(
    `
    WITH RECURSIVE descendants AS (
      SELECT * FROM ${TABLE} WHERE id = ?
      UNION ALL
      SELECT c.* FROM ${TABLE} c
      INNER JOIN descendants d ON c.parent_id = d.id
    )
    SELECT * FROM descendants WHERE id != ?
    `,
    [categoryId, categoryId],
  ).then((result) => result.rows);

/**
 * Returns all ancestors of a category using a recursive CTE (PostgreSQL).
 * Excludes the starting category itself.
 */
const getAncestors = (categoryId, trx = knex) =>
  (trx || knex).raw(
    `
    WITH RECURSIVE ancestors AS (
      SELECT * FROM ${TABLE} WHERE id = ?
      UNION ALL
      SELECT c.* FROM ${TABLE} c
      INNER JOIN ancestors a ON c.id = a.parent_id
    )
    SELECT * FROM ancestors WHERE id != ?
    `,
    [categoryId, categoryId],
  ).then((result) => result.rows);

/**
 * Returns the full subtree (category + descendants) as a flat list.
 */
const getSubtree = (categoryId, trx = knex) =>
  (trx || knex).raw(
    `
    WITH RECURSIVE subtree AS (
      SELECT * FROM ${TABLE} WHERE id = ?
      UNION ALL
      SELECT c.* FROM ${TABLE} c
      INNER JOIN subtree s ON c.parent_id = s.id
    )
    SELECT * FROM subtree
    `,
    [categoryId],
  ).then((result) => result.rows);

/**
 * Returns descendent IDs (including the root) for filtering products by category.
 */
const getSubtreeIds = async (categoryId, trx = knex) => {
  const rows = await getSubtree(categoryId, trx);
  return rows.map((r) => r.id);
};

module.exports = {
  findById,
  findBySlug,
  findRootCategories,
  findDirectChildren,
  findAll,
  count,
  create,
  update,
  remove,
  getDescendants,
  getAncestors,
  getSubtree,
  getSubtreeIds,
};
