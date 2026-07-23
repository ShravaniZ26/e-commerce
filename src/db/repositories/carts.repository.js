'use strict';

const knex = require('../knex');

const CARTS_TABLE = 'carts';
const ITEMS_TABLE = 'cart_items';

// ── Carts ─────────────────────────────────────────────────────────────────────

const findById = (id, trx = knex) =>
  trx(CARTS_TABLE).where({ id }).first();

const findByUserId = (user_id, trx = knex) =>
  trx(CARTS_TABLE).where({ user_id }).first();

const findBySessionId = (session_id, trx = knex) =>
  trx(CARTS_TABLE).where({ session_id }).first();

const createCart = (data, trx = knex) =>
  trx(CARTS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateCart = (id, data, trx = knex) =>
  trx(CARTS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteCart = (id, trx = knex) =>
  trx(CARTS_TABLE).where({ id }).delete();

const applyPromoCode = (id, promo_code_id, trx = knex) =>
  trx(CARTS_TABLE).where({ id }).update({ promo_code_id }).returning('*').then((rows) => rows[0]);

const removePromoCode = (id, trx = knex) =>
  trx(CARTS_TABLE).where({ id }).update({ promo_code_id: null }).returning('*').then((rows) => rows[0]);

// ── Cart Items ────────────────────────────────────────────────────────────────

const findItemById = (id, trx = knex) =>
  trx(ITEMS_TABLE).where({ id }).first();

const findItemByCartAndSku = (cart_id, sku_id, trx = knex) =>
  trx(ITEMS_TABLE).where({ cart_id, sku_id }).first();

const findItemsForCart = (cart_id, trx = knex) =>
  trx(ITEMS_TABLE)
    .join('skus', 'skus.id', `${ITEMS_TABLE}.sku_id`)
    .join('products', 'products.id', 'skus.product_id')
    .where({ cart_id })
    .select(
      `${ITEMS_TABLE}.*`,
      'skus.sku_code',
      'skus.price',
      'skus.stock_quantity',
      'skus.attributes as sku_attributes',
      'products.name as product_name',
      'products.slug as product_slug',
    )
    .orderBy(`${ITEMS_TABLE}.created_at`, 'asc');

const addItem = (data, trx = knex) =>
  trx(ITEMS_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateItem = (id, data, trx = knex) =>
  trx(ITEMS_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const upsertItem = (cart_id, sku_id, quantity, trx = knex) =>
  trx(ITEMS_TABLE)
    .insert({ cart_id, sku_id, quantity })
    .onConflict(['cart_id', 'sku_id'])
    .merge({ quantity })
    .returning('*')
    .then((rows) => rows[0]);

const removeItem = (id, trx = knex) =>
  trx(ITEMS_TABLE).where({ id }).delete();

const removeItemByCartAndSku = (cart_id, sku_id, trx = knex) =>
  trx(ITEMS_TABLE).where({ cart_id, sku_id }).delete();

const clearCartItems = (cart_id, trx = knex) =>
  trx(ITEMS_TABLE).where({ cart_id }).delete();

const countItemsInCart = (cart_id, trx = knex) =>
  trx(ITEMS_TABLE).where({ cart_id }).count('id as count').then((rows) => parseInt(rows[0].count, 10));

module.exports = {
  findById,
  findByUserId,
  findBySessionId,
  createCart,
  updateCart,
  deleteCart,
  applyPromoCode,
  removePromoCode,
  findItemById,
  findItemByCartAndSku,
  findItemsForCart,
  addItem,
  updateItem,
  upsertItem,
  removeItem,
  removeItemByCartAndSku,
  clearCartItems,
  countItemsInCart,
};
