'use strict';

const SEED_DATE = new Date('2024-01-01T00:00:00.000Z');

const BRANDS = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    name: 'Apple',
    slug: 'apple',
    logo_url: null,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    name: 'Samsung',
    slug: 'samsung',
    logo_url: null,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    name: 'Nike',
    slug: 'nike',
    logo_url: null,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    name: 'Adidas',
    slug: 'adidas',
    logo_url: null,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '40000000-0000-0000-0000-000000000005',
    name: 'IKEA',
    slug: 'ikea',
    logo_url: null,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
];

/**
 * Seed sample brands.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex('brands').insert(BRANDS).onConflict('id').merge();
};
