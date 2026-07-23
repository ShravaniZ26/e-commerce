/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('order_tracking', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.string('carrier', 200).nullable();
    table.string('tracking_number', 255).nullable();
    table.string('tracking_url', 500).nullable();
    table.string('status', 100).nullable();
    table.text('status_description').nullable();
    table.jsonb('checkpoints').nullable().comment('Array of carrier checkpoint events');
    table.timestamp('estimated_delivery_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id'], 'idx_order_tracking_order_id');
    table.index(['tracking_number'], 'idx_order_tracking_tracking_number');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_tracking');
};
