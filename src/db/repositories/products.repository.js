'use strict';

const knex = require('../knex');

const PRODUCTS_TABLE = 'products';
const IMAGES_TABLE = 'product_images';

// ── Products ─────────────────────────────────────────────────────────────────

const findById = (id, trx = knex) =>
  trx(PRODUCTS_TABLE).where({ id }).first();

const findBySlug = (slug, trx = knex) =>
  trx(PRODUCTS_TABLE).where({ slug }).first();

const findAll = (
  { limit = 20, offset = 0, is_active, category_id, category_ids, brand_id, search } = {},
  trx = knex,
) => {
  const query = trx(PRODUCTS_TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (brand_id) query.where({ brand_id });
  if (category_id) query.where({ category_id });
  if (Array.isArray(category_ids) && category_ids.length > 0) query.whereIn('category_id', category_ids);
  if (search) {
    query.where((builder) => {
      builder.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`);
    });
  }
  return query.limit(limit).offset(offset).orderBy('created_at', 'desc');
};

const count = ({ is_active, category_id, category_ids, brand_id, search } = {}, trx = knex) => {
  const query = trx(PRODUCTS_TABLE);
  if (typeof is_active === 'boolean') query.where({ is_active });
  if (brand_id) query.where({ brand_id });
  if (category_id) query.where({ category_id });
  if (Array.isArray(category_ids) && category_ids.length > 0) query.whereIn('category_id', category_ids);
  if (search) {
    query.where((builder) => {
      builder.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`);
    });
  }
  return query.count('id as count').then((rows) => parseInt(rows[0].count, 10));
};

const create = (data, trx = knex) =>
  trx(PRODUCTS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const update = (id, data, trx = knex) =>
  trx(PRODUCTS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const remove = (id, trx = knex) =>
  trx(PRODUCTS_TABLE).where({ id }).delete();

// ── Product Images ────────────────────────────────────────────────────────────

const findImageById = (id, trx = knex) =>
  trx(IMAGES_TABLE).where({ id }).first();

const findImagesForProduct = (product_id, trx = knex) =>
  trx(IMAGES_TABLE).where({ product_id }).orderBy('sort_order', 'asc');

const findPrimaryImage = (product_id, trx = knex) =>
  trx(IMAGES_TABLE).where({ product_id, is_primary: true }).first();

const addImage = (data, trx = knex) =>
  trx(IMAGES_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateImage = (id, data, trx = knex) =>
  trx(IMAGES_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const removeImage = (id, trx = knex) =>
  trx(IMAGES_TABLE).where({ id }).delete();

const removeAllImagesForProduct = (product_id, trx = knex) =>
  trx(IMAGES_TABLE).where({ product_id }).delete();

const clearPrimaryForProduct = (product_id, trx = knex) =>
  trx(IMAGES_TABLE).where({ product_id, is_primary: true }).update({ is_primary: false });

const setPrimaryImage = async (id, product_id, trx = knex) => {
  const useTransaction = trx === knex;
  const execute = async (t) => {
    await clearPrimaryForProduct(product_id, t);
    return t(IMAGES_TABLE).where({ id, product_id }).update({ is_primary: true }).returning('*').then((rows) => rows[0]);
  };
  if (useTransaction) return knex.transaction(execute);
  return execute(trx);
};

module.exports = {
  findById,
  findBySlug,
  findAll,
  count,
  create,
  update,
  remove,
  findImageById,
  findImagesForProduct,
  findPrimaryImage,
  addImage,
  updateImage,
  removeImage,
  removeAllImagesForProduct,
  clearPrimaryForProduct,
  setPrimaryImage,
};
