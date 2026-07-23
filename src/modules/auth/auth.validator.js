'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'string.base': 'Name must be a string.',
    'string.max': 'Name must not exceed 100 characters.',
    'any.required': 'Name is required.',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.base': 'Password must be a string.',
    'string.min': 'Password must be at least 8 characters.',
    'string.max': 'Password must not exceed 128 characters.',
    'any.required': 'Password is required.',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().required().messages({
    'string.base': 'Password must be a string.',
    'any.required': 'Password is required.',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().required().messages({
    'string.base': 'Token must be a string.',
    'any.required': 'Token is required.',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.base': 'Password must be a string.',
    'string.min': 'Password must be at least 8 characters.',
    'string.max': 'Password must not exceed 128 characters.',
    'any.required': 'Password is required.',
  }),
});

const guestRegisterSchema = Joi.object({
  name: Joi.string().trim().max(100).optional().messages({
    'string.base': 'Name must be a string.',
    'string.max': 'Name must not exceed 100 characters.',
  }),
});

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Returns an Express middleware that validates req.body against the given
 * Joi schema. On failure it responds 400 with a structured errors array.
 * On success it replaces req.body with the sanitised Joi output and calls next().
 *
 * @param {import('joi').ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed.',
      errors: error.details.map((detail) => ({
        field: detail.context && detail.context.key ? detail.context.key : null,
        message: detail.message,
      })),
    });
  }

  req.body = value;
  return next();
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  guestRegisterSchema,
  validate,
};
