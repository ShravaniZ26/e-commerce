/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('stock_reservations', (table) => {
    table.increments('id').primary();
    table
      .integer('sku_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('skus')
      .onDelete('RESTRICT');
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.integer('quantity').notNullable();
    table
      .enu('status', ['active', 'released', 'confirmed'], {
        useNative: true,
        enumName: 'reservation_status_enum',
      })
      .notNullable()
      .defaultTo('active');
    table.timestamp('reserved_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('released_at').nullable();
    table.index(['sku_id'], 'idx_stock_reservations_sku_id');
    table.index(['order_id'], 'idx_stock_reservations_order_id');
    table.index(['status'], 'idx_stock_reservations_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('stock_reservations');
  await knex.raw('DROP TYPE IF EXISTS reservation_status_enum');
};
