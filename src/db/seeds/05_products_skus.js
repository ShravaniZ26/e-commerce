'use strict';

const SEED_DATE = new Date('2024-01-01T00:00:00.000Z');

// ── Brand IDs (from 04_brands.js) ─────────────────────────────────────────
const BRAND_APPLE   = '40000000-0000-0000-0000-000000000001';
const BRAND_SAMSUNG = '40000000-0000-0000-0000-000000000002';
const BRAND_NIKE    = '40000000-0000-0000-0000-000000000003';
const BRAND_ADIDAS  = '40000000-0000-0000-0000-000000000004';

// ── Category IDs (from 03_categories.js) ──────────────────────────────────
const CAT_PHONES  = '30000000-0000-0000-0000-000000000002';
const CAT_LAPTOPS = '30000000-0000-0000-0000-000000000003';
const CAT_MENS    = '30000000-0000-0000-0000-000000000005';
const CAT_WOMENS  = '30000000-0000-0000-0000-000000000006';

// ── Product IDs ────────────────────────────────────────────────────────────
const PROD_IPHONE15   = '50000000-0000-0000-0000-000000000001';
const PROD_MBP14      = '50000000-0000-0000-0000-000000000002';
const PROD_GALAXY_S24 = '50000000-0000-0000-0000-000000000003';
const PROD_AIRMAX270  = '50000000-0000-0000-0000-000000000004';
const PROD_UB23       = '50000000-0000-0000-0000-000000000005';

const PRODUCTS = [
  {
    id: PROD_IPHONE15,
    name: 'iPhone 15',
    slug: 'iphone-15',
    description: 'The latest iPhone with Dynamic Island and 48 MP camera system.',
    brand_id: BRAND_APPLE,
    category_id: CAT_PHONES,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: PROD_MBP14,
    name: 'MacBook Pro 14-inch',
    slug: 'macbook-pro-14',
    description: 'MacBook Pro with M3 chip. Supercharged for pros.',
    brand_id: BRAND_APPLE,
    category_id: CAT_LAPTOPS,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: PROD_GALAXY_S24,
    name: 'Samsung Galaxy S24',
    slug: 'samsung-galaxy-s24',
    description: 'Galaxy AI is here. The next generation of mobile AI.',
    brand_id: BRAND_SAMSUNG,
    category_id: CAT_PHONES,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: PROD_AIRMAX270,
    name: 'Nike Air Max 270',
    slug: 'nike-air-max-270',
    description: "Nike's biggest Air unit yet for all-day cushioning.",
    brand_id: BRAND_NIKE,
    category_id: CAT_MENS,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: PROD_UB23,
    name: 'Adidas Ultraboost 23',
    slug: 'adidas-ultraboost-23',
    description: 'Our most cushioned running shoe returns with a sculpted new shape.',
    brand_id: BRAND_ADIDAS,
    category_id: CAT_WOMENS,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
];

const SKUS = [
  // ── iPhone 15 ─────────────────────────────────────────────────────────────
  {
    id: '60000000-0000-0000-0000-000000000001',
    product_id: PROD_IPHONE15,
    sku_code: 'IPHONE15-BLK-128',
    price: 799.00,
    compare_at_price: 849.00,
    stock_qty: 50,
    attributes: JSON.stringify({ color: 'Black', storage: '128GB' }),
    weight_grams: 171,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    product_id: PROD_IPHONE15,
    sku_code: 'IPHONE15-BLK-256',
    price: 899.00,
    compare_at_price: 949.00,
    stock_qty: 30,
    attributes: JSON.stringify({ color: 'Black', storage: '256GB' }),
    weight_grams: 171,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000003',
    product_id: PROD_IPHONE15,
    sku_code: 'IPHONE15-WHT-128',
    price: 799.00,
    compare_at_price: 849.00,
    stock_qty: 45,
    attributes: JSON.stringify({ color: 'White', storage: '128GB' }),
    weight_grams: 171,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000004',
    product_id: PROD_IPHONE15,
    sku_code: 'IPHONE15-WHT-256',
    price: 899.00,
    compare_at_price: 949.00,
    stock_qty: 25,
    attributes: JSON.stringify({ color: 'White', storage: '256GB' }),
    weight_grams: 171,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000005',
    product_id: PROD_IPHONE15,
    sku_code: 'IPHONE15-PNK-128',
    price: 799.00,
    compare_at_price: 849.00,
    stock_qty: 40,
    attributes: JSON.stringify({ color: 'Pink', storage: '128GB' }),
    weight_grams: 171,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },

  // ── MacBook Pro 14-inch ───────────────────────────────────────────────────
  {
    id: '60000000-0000-0000-0000-000000000006',
    product_id: PROD_MBP14,
    sku_code: 'MBP14-M3-16-512-SGR',
    price: 1599.00,
    compare_at_price: null,
    stock_qty: 15,
    attributes: JSON.stringify({ chip: 'M3', memory: '16GB', storage: '512GB', color: 'Space Grey' }),
    weight_grams: 1610,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000007',
    product_id: PROD_MBP14,
    sku_code: 'MBP14-M3P-36-512-SGR',
    price: 1999.00,
    compare_at_price: null,
    stock_qty: 10,
    attributes: JSON.stringify({ chip: 'M3 Pro', memory: '36GB', storage: '512GB', color: 'Space Grey' }),
    weight_grams: 1610,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000008',
    product_id: PROD_MBP14,
    sku_code: 'MBP14-M3P-36-512-SLV',
    price: 1999.00,
    compare_at_price: null,
    stock_qty: 8,
    attributes: JSON.stringify({ chip: 'M3 Pro', memory: '36GB', storage: '512GB', color: 'Silver' }),
    weight_grams: 1610,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },

  // ── Samsung Galaxy S24 ────────────────────────────────────────────────────
  {
    id: '60000000-0000-0000-0000-000000000009',
    product_id: PROD_GALAXY_S24,
    sku_code: 'GALAXYS24-BLK-256',
    price: 799.99,
    compare_at_price: 899.99,
    stock_qty: 35,
    attributes: JSON.stringify({ color: 'Phantom Black', storage: '256GB' }),
    weight_grams: 167,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000010',
    product_id: PROD_GALAXY_S24,
    sku_code: 'GALAXYS24-CRM-256',
    price: 799.99,
    compare_at_price: 899.99,
    stock_qty: 30,
    attributes: JSON.stringify({ color: 'Cream', storage: '256GB' }),
    weight_grams: 167,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000011',
    product_id: PROD_GALAXY_S24,
    sku_code: 'GALAXYS24-VLT-256',
    price: 799.99,
    compare_at_price: 899.99,
    stock_qty: 20,
    attributes: JSON.stringify({ color: 'Violet', storage: '256GB' }),
    weight_grams: 167,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },

  // ── Nike Air Max 270 ──────────────────────────────────────────────────────
  {
    id: '60000000-0000-0000-0000-000000000012',
    product_id: PROD_AIRMAX270,
    sku_code: 'AIRMAX270-BW-US8',
    price: 150.00,
    compare_at_price: 180.00,
    stock_qty: 20,
    attributes: JSON.stringify({ color: 'Black/White', size_us: '8' }),
    weight_grams: 380,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000013',
    product_id: PROD_AIRMAX270,
    sku_code: 'AIRMAX270-BW-US9',
    price: 150.00,
    compare_at_price: 180.00,
    stock_qty: 25,
    attributes: JSON.stringify({ color: 'Black/White', size_us: '9' }),
    weight_grams: 390,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000014',
    product_id: PROD_AIRMAX270,
    sku_code: 'AIRMAX270-BW-US10',
    price: 150.00,
    compare_at_price: 180.00,
    stock_qty: 20,
    attributes: JSON.stringify({ color: 'Black/White', size_us: '10' }),
    weight_grams: 400,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000015',
    product_id: PROD_AIRMAX270,
    sku_code: 'AIRMAX270-WB-US9',
    price: 150.00,
    compare_at_price: 180.00,
    stock_qty: 18,
    attributes: JSON.stringify({ color: 'White/Blue', size_us: '9' }),
    weight_grams: 390,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },

  // ── Adidas Ultraboost 23 ──────────────────────────────────────────────────
  {
    id: '60000000-0000-0000-0000-000000000016',
    product_id: PROD_UB23,
    sku_code: 'UB23-CWT-US6',
    price: 190.00,
    compare_at_price: null,
    stock_qty: 15,
    attributes: JSON.stringify({ color: 'Core White', size_us: '6' }),
    weight_grams: 320,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000017',
    product_id: PROD_UB23,
    sku_code: 'UB23-CWT-US7',
    price: 190.00,
    compare_at_price: null,
    stock_qty: 20,
    attributes: JSON.stringify({ color: 'Core White', size_us: '7' }),
    weight_grams: 330,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000018',
    product_id: PROD_UB23,
    sku_code: 'UB23-CBK-US6',
    price: 190.00,
    compare_at_price: null,
    stock_qty: 12,
    attributes: JSON.stringify({ color: 'Core Black', size_us: '6' }),
    weight_grams: 320,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '60000000-0000-0000-0000-000000000019',
    product_id: PROD_UB23,
    sku_code: 'UB23-CBK-US7',
    price: 190.00,
    compare_at_price: null,
    stock_qty: 18,
    attributes: JSON.stringify({ color: 'Core Black', size_us: '7' }),
    weight_grams: 330,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
];

/**
 * Seed sample products and SKU variants.
 * Products are inserted before SKUs to satisfy the product_id FK constraint.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex('products').insert(PRODUCTS).onConflict('id').merge();
  await knex('skus').insert(SKUS).onConflict('id').merge();
};
