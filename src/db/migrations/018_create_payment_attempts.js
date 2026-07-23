/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('payment_attempts', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table.string('gateway', 100).notNullable();
    table.string('gateway_order_id', 255).nullable();
    table.string('gateway_payment_id', 255).nullable();
    table.string('gateway_signature', 500).nullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('INR');
    table
      .enu('status', ['initiated', 'pending', 'success', 'failed', 'cancelled'], {
        useNative: true,
        enumName: 'payment_status_enum',
      })
      .notNullable()
      .defaultTo('initiated');
    table.jsonb('gateway_response').nullable();
    table.text('failure_reason').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id'], 'idx_payment_attempts_order_id');
    table.index(['gateway_payment_id'], 'idx_payment_attempts_gateway_payment_id');
    table.index(['status'], 'idx_payment_attempts_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payment_attempts');
  await knex.raw('DROP TYPE IF EXISTS payment_status_enum');
};
