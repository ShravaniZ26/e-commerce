'use strict';

const config = require('./index');

/**
 * Duration of the rate-limit sliding window in milliseconds.
 */
const RATE_LIMIT_WINDOW_MS = config.rateLimit.windowMs;

/**
 * Maximum number of requests allowed per window per IP.
 */
const RATE_LIMIT_MAX = config.rateLimit.max;

module.exports = {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
};
