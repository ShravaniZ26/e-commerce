/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('promo_codes', (table) => {
    table.increments('id').primary();
    table.string('code', 100).notNullable().unique();
    table
      .enu('discount_type', ['percentage', 'fixed_amount', 'free_shipping'], {
        useNative: true,
        enumName: 'discount_type_enum',
      })
      .notNullable();
    table.decimal('discount_value', 12, 2).notNullable();
    table.decimal('min_order_amount', 12, 2).nullable();
    table.decimal('max_discount_amount', 12, 2).nullable();
    table.integer('usage_limit').nullable();
    table.integer('usage_count').notNullable().defaultTo(0);
    table.integer('per_user_limit').nullable();
    table.jsonb('rules').nullable().comment('Additional eligibility rules as JSON');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('starts_at').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['code'], 'idx_promo_codes_code');
    table.index(['is_active'], 'idx_promo_codes_is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('promo_codes');
  await knex.raw('DROP TYPE IF EXISTS discount_type_enum');
};
