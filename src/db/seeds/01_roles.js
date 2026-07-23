'use strict';

const SEED_DATE = new Date('2024-01-01T00:00:00.000Z');

const ROLES = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'customer',
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'staff',
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'admin',
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
];

/**
 * Seed default roles: customer, staff, admin.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex('roles').insert(ROLES).onConflict('id').merge();
};
