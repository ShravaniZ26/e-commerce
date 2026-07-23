/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .comment('NULL indicates a broadcast notification for all users');
    table.string('title', 300).notNullable();
    table.text('message').notNullable();
    table
      .enu(
        'type',
        [
          'order_update',
          'payment',
          'promotion',
          'account',
          'return',
          'general',
        ],
        { useNative: true, enumName: 'notification_type_enum' }
      )
      .notNullable()
      .defaultTo('general');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.string('action_url', 500).nullable();
    table.jsonb('meta').nullable();
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id'], 'idx_notifications_user_id');
    table.index(['is_read'], 'idx_notifications_is_read');
    table.index(['type'], 'idx_notifications_type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.raw('DROP TYPE IF EXISTS notification_type_enum');
};
