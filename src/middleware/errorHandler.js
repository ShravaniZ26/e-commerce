'use strict';

const logger = require('../utils/logger');

/**
 * Centralised Express error handler.
 * Must be registered as the last middleware in the application stack.
 * Produces structured JSON error responses for all unhandled errors.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message =
    statusCode < 500 ? err.message : 'An unexpected error occurred. Please try again later.';

  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      statusCode,
    });
  } else {
    logger.warn({
      message: err.message,
      code,
      method: req.method,
      url: req.originalUrl,
      statusCode,
    });
  }

  const body = {
    status: 'error',
    code,
    message,
  };

  if (err.details) {
    body.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
}

module.exports = errorHandler;
