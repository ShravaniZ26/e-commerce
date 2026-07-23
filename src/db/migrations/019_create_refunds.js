/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('refunds', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('RESTRICT');
    table
      .integer('payment_attempt_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('payment_attempts')
      .onDelete('RESTRICT');
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('INR');
    table
      .enu('status', ['pending', 'processing', 'succeeded', 'failed'], {
        useNative: true,
        enumName: 'refund_status_enum',
      })
      .notNullable()
      .defaultTo('pending');
    table.text('reason').nullable();
    table.string('gateway_refund_id', 255).nullable();
    table.jsonb('gateway_response').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id'], 'idx_refunds_order_id');
    table.index(['payment_attempt_id'], 'idx_refunds_payment_attempt_id');
    table.index(['status'], 'idx_refunds_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('refunds');
  await knex.raw('DROP TYPE IF EXISTS refund_status_enum');
};
