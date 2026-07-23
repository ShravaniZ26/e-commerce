'use strict';

const SEED_DATE = new Date('2024-01-01T00:00:00.000Z');

/**
 * discount_type values:
 *   'percentage'   – reduce total by discount_value %
 *   'fixed'        – reduce total by a fixed currency amount
 *   'free_shipping' – waive shipping cost entirely
 */
const PROMO_CODES = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    code: 'WELCOME10',
    description: '10% off your first order',
    discount_type: 'percentage',
    discount_value: 10.00,
    min_order_value: 50.00,
    max_uses: 1000,
    uses_count: 0,
    starts_at: new Date('2024-01-01T00:00:00.000Z'),
    expires_at: new Date('2025-12-31T23:59:59.000Z'),
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    code: 'SUMMER20',
    description: '20% off summer sale',
    discount_type: 'percentage',
    discount_value: 20.00,
    min_order_value: 100.00,
    max_uses: 500,
    uses_count: 0,
    starts_at: new Date('2024-06-01T00:00:00.000Z'),
    expires_at: new Date('2024-08-31T23:59:59.000Z'),
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '70000000-0000-0000-0000-000000000003',
    code: 'FREESHIP',
    description: 'Free shipping on any order',
    discount_type: 'free_shipping',
    discount_value: 0.00,
    min_order_value: 0.00,
    max_uses: null,
    uses_count: 0,
    starts_at: new Date('2024-01-01T00:00:00.000Z'),
    expires_at: new Date('2024-12-31T23:59:59.000Z'),
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '70000000-0000-0000-0000-000000000004',
    code: 'FLASH50',
    description: '$50 off orders over $200',
    discount_type: 'fixed',
    discount_value: 50.00,
    min_order_value: 200.00,
    max_uses: 100,
    uses_count: 0,
    starts_at: new Date('2024-01-01T00:00:00.000Z'),
    expires_at: new Date('2024-03-31T23:59:59.000Z'),
    is_active: false,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '70000000-0000-0000-0000-000000000005',
    code: 'TECH15',
    description: '15% off all electronics over $300',
    discount_type: 'percentage',
    discount_value: 15.00,
    min_order_value: 300.00,
    max_uses: 200,
    uses_count: 0,
    starts_at: new Date('2024-01-01T00:00:00.000Z'),
    expires_at: new Date('2024-12-31T23:59:59.000Z'),
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
];

/**
 * Seed sample promo codes.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex('promo_codes').insert(PROMO_CODES).onConflict('id').merge();
};
