/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('return_requests', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('RESTRICT');
    table.text('reason').notNullable();
    table
      .enu(
        'status',
        ['requested', 'approved', 'rejected', 'picked_up', 'refund_initiated', 'closed'],
        { useNative: true, enumName: 'return_status_enum' }
      )
      .notNullable()
      .defaultTo('requested');
    table.text('rejection_reason').nullable();
    table.jsonb('items').nullable().comment('Array of order_item_ids and quantities being returned');
    table
      .integer('resolved_by_user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('resolved_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id'], 'idx_return_requests_order_id');
    table.index(['status'], 'idx_return_requests_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('return_requests');
  await knex.raw('DROP TYPE IF EXISTS return_status_enum');
};
