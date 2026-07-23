'use strict';

const bcrypt = require('bcrypt');

// Plaintext password for development: Admin@123!
const ADMIN_PASSWORD_PLAINTEXT = 'Admin@123!';
const BCRYPT_ROUNDS = 12;

const ADMIN_ROLE_ID = '10000000-0000-0000-0000-000000000003';
const SEED_DATE = new Date('2024-01-01T00:00:00.000Z');

/**
 * Seed default admin user for development.
 * Default credentials — admin@example.com / Admin@123!
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD_PLAINTEXT, BCRYPT_ROUNDS);

  const users = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      email: 'admin@example.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      role_id: ADMIN_ROLE_ID,
      is_active: true,
      email_verified: true,
      created_at: SEED_DATE,
      updated_at: SEED_DATE,
    },
  ];

  await knex('users').insert(users).onConflict('id').merge([
    'first_name',
    'last_name',
    'role_id',
    'is_active',
    'email_verified',
    'updated_at',
  ]);
};
