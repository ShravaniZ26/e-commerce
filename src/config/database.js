'use strict';

const config = require('./index');

/**
 * Knex connection configuration derived from the application config.
 * @type {import('knex').Knex.Config}
 */
const databaseConfig = {
  client: config.db.client,
  connection: {
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
  },
  pool: {
    min: config.db.pool.min,
    max: config.db.pool.max,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
  debug: config.env === 'development',
};

module.exports = databaseConfig;
