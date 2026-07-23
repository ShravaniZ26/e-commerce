'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication routes (login, register, etc.).
 * Allows up to 10 requests per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
  },
});

/**
 * Rate limiter for password-reset routes.
 * Allows up to 5 requests per 60-minute window per IP.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset attempts. Please try again after 1 hour.',
    });
  },
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
};
