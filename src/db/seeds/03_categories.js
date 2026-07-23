'use strict';

const SEED_DATE = new Date('2024-01-01T00:00:00.000Z');

// Root category IDs
const CAT_ELECTRONICS  = '30000000-0000-0000-0000-000000000001';
const CAT_CLOTHING     = '30000000-0000-0000-0000-000000000004';
const CAT_HOME_GARDEN  = '30000000-0000-0000-0000-000000000008';

// Electronics children
const CAT_PHONES       = '30000000-0000-0000-0000-000000000002';
const CAT_LAPTOPS      = '30000000-0000-0000-0000-000000000003';

// Clothing children
const CAT_MENS         = '30000000-0000-0000-0000-000000000005';
const CAT_WOMENS       = '30000000-0000-0000-0000-000000000006';
const CAT_KIDS         = '30000000-0000-0000-0000-000000000007';

const CATEGORIES = [
  // ── Root categories ───────────────────────────────────────────────────────
  {
    id: CAT_ELECTRONICS,
    name: 'Electronics',
    slug: 'electronics',
    parent_id: null,
    sort_order: 1,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: CAT_CLOTHING,
    name: 'Clothing',
    slug: 'clothing',
    parent_id: null,
    sort_order: 2,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: CAT_HOME_GARDEN,
    name: 'Home & Garden',
    slug: 'home-and-garden',
    parent_id: null,
    sort_order: 3,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },

  // ── Electronics children ──────────────────────────────────────────────────
  {
    id: CAT_PHONES,
    name: 'Phones',
    slug: 'phones',
    parent_id: CAT_ELECTRONICS,
    sort_order: 1,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: CAT_LAPTOPS,
    name: 'Laptops',
    slug: 'laptops',
    parent_id: CAT_ELECTRONICS,
    sort_order: 2,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },

  // ── Clothing children ─────────────────────────────────────────────────────
  {
    id: CAT_MENS,
    name: "Men's",
    slug: 'mens',
    parent_id: CAT_CLOTHING,
    sort_order: 1,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: CAT_WOMENS,
    name: "Women's",
    slug: 'womens',
    parent_id: CAT_CLOTHING,
    sort_order: 2,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: CAT_KIDS,
    name: "Kids'",
    slug: 'kids',
    parent_id: CAT_CLOTHING,
    sort_order: 3,
    is_active: true,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
];

/**
 * Seed sample category tree.
 * Inserts root categories first so that self-referential FK constraints are satisfied.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  // Insert root categories first to satisfy the self-referential parent_id FK.
  const roots = CATEGORIES.filter((c) => c.parent_id === null);
  const children = CATEGORIES.filter((c) => c.parent_id !== null);

  await knex('categories').insert(roots).onConflict('id').merge();
  await knex('categories').insert(children).onConflict('id').merge();
};
