'use strict';

const config = require('./index');

/**
 * JWT configuration constants.
 */
const JWT_SECRET = config.jwt.secret;

/**
 * Access token time-to-live (e.g. "15m").
 */
const JWT_ACCESS_TTL = config.jwt.accessTtl;

/**
 * Password-reset token time-to-live (e.g. "1h").
 */
const JWT_RESET_TTL = config.jwt.resetTtl;

module.exports = {
  JWT_SECRET,
  JWT_ACCESS_TTL,
  JWT_RESET_TTL,
};
