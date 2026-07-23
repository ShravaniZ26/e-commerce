'use strict';

const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * Stream that forwards Morgan output to Winston.
 */
const morganStream = {
  write(message) {
    // Morgan appends a trailing newline; strip it before passing to Winston.
    logger.http(message.trimEnd());
  },
};

/**
 * Custom Morgan token: request body (sanitised — passwords are redacted).
 */
morgan.token('body', (req) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return '-';
  }
  const sanitised = { ...req.body };
  const sensitiveFields = ['password', 'passwordConfirm', 'currentPassword', 'newPassword', 'token', 'secret'];
  sensitiveFields.forEach((field) => {
    if (field in sanitised) {
      sanitised[field] = '[REDACTED]';
    }
  });
  return JSON.stringify(sanitised);
});

/**
 * Custom Morgan token: authenticated user id.
 */
morgan.token('user-id', (req) => (req.user && req.user.id ? String(req.user.id) : 'anonymous'));

/**
 * HTTP request logging middleware.
 *
 * In production a concise format is used; in other environments a verbose
 * format includes the request body and user id.
 */
const requestLogger =
  process.env.NODE_ENV === 'production'
    ? morgan('combined', { stream: morganStream })
    : morgan(':method :url :status :res[content-length] - :response-time ms | user=:user-id body=:body', {
        stream: morganStream,
      });

module.exports = requestLogger;
