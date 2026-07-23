/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('serviceable_pin_codes', (table) => {
    table.increments('id').primary();
    table.string('pin_code', 20).notNullable().unique();
    table.string('city', 100).notNullable();
    table.string('state', 100).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['pin_code'], 'idx_serviceable_pin_codes_pin_code');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('serviceable_pin_codes');
};
