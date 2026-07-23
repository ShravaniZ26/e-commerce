/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('skus', (table) => {
    table.increments('id').primary();
    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    table.string('sku_code', 100).notNullable().unique();
    table.string('size', 50).nullable();
    table.string('colour', 100).nullable();
    table.decimal('price', 12, 2).notNullable();
    table.decimal('compare_at_price', 12, 2).nullable();
    table.integer('stock').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('barcode', 200).nullable();
    table.decimal('weight_grams', 10, 2).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['product_id'], 'idx_skus_product_id');
    table.index(['sku_code'], 'idx_skus_sku_code');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('skus');
};
