'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createAddressSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.base': 'Full name must be a string',
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 100 characters',
      'any.required': 'Full name is required',
    }),

  phone: Joi.string().trim().pattern(/^\d{10}$/).required()
    .messages({
      'string.base': 'Phone number must be a string',
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be a valid 10-digit number',
      'any.required': 'Phone number is required',
    }),

  address_line1: Joi.string().trim().min(5).max(255).required()
    .messages({
      'string.base': 'Address line 1 must be a string',
      'string.empty': 'Address line 1 is required',
      'string.min': 'Address line 1 must be at least 5 characters',
      'string.max': 'Address line 1 must not exceed 255 characters',
      'any.required': 'Address line 1 is required',
    }),

  address_line2: Joi.string().trim().max(255).allow('', null).optional()
    .messages({
      'string.base': 'Address line 2 must be a string',
      'string.max': 'Address line 2 must not exceed 255 characters',
    }),

  city: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.base': 'City must be a string',
      'string.empty': 'City is required',
      'string.min': 'City must be at least 2 characters',
      'string.max': 'City must not exceed 100 characters',
      'any.required': 'City is required',
    }),

  state: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.base': 'State must be a string',
      'string.empty': 'State is required',
      'string.min': 'State must be at least 2 characters',
      'string.max': 'State must not exceed 100 characters',
      'any.required': 'State is required',
    }),

  pin_code: Joi.string().trim().pattern(/^\d{6}$/).required()
    .messages({
      'string.base': 'PIN code must be a string',
      'string.empty': 'PIN code is required',
      'string.pattern.base': 'PIN code must be a valid 6-digit number',
      'any.required': 'PIN code is required',
    }),

  landmark: Joi.string().trim().max(255).allow('', null).optional()
    .messages({
      'string.base': 'Landmark must be a string',
      'string.max': 'Landmark must not exceed 255 characters',
    }),

  label: Joi.string().trim().valid('home', 'work', 'other').optional()
    .messages({
      'any.only': 'Label must be one of home, work, or other',
    }),

  is_default: Joi.boolean().optional().default(false)
    .messages({
      'boolean.base': 'is_default must be a boolean',
    }),
});

const updateAddressSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100)
    .messages({
      'string.base': 'Full name must be a string',
      'string.empty': 'Full name cannot be empty',
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 100 characters',
    }),

  phone: Joi.string().trim().pattern(/^\d{10}$/)
    .messages({
      'string.base': 'Phone number must be a string',
      'string.empty': 'Phone number cannot be empty',
      'string.pattern.base': 'Phone number must be a valid 10-digit number',
    }),

  address_line1: Joi.string().trim().min(5).max(255)
    .messages({
      'string.base': 'Address line 1 must be a string',
      'string.empty': 'Address line 1 cannot be empty',
      'string.min': 'Address line 1 must be at least 5 characters',
      'string.max': 'Address line 1 must not exceed 255 characters',
    }),

  address_line2: Joi.string().trim().max(255).allow('', null)
    .messages({
      'string.base': 'Address line 2 must be a string',
      'string.max': 'Address line 2 must not exceed 255 characters',
    }),

  city: Joi.string().trim().min(2).max(100)
    .messages({
      'string.base': 'City must be a string',
      'string.empty': 'City cannot be empty',
      'string.min': 'City must be at least 2 characters',
      'string.max': 'City must not exceed 100 characters',
    }),

  state: Joi.string().trim().min(2).max(100)
    .messages({
      'string.base': 'State must be a string',
      'string.empty': 'State cannot be empty',
      'string.min': 'State must be at least 2 characters',
      'string.max': 'State must not exceed 100 characters',
    }),

  pin_code: Joi.string().trim().pattern(/^\d{6}$/)
    .messages({
      'string.base': 'PIN code must be a string',
      'string.empty': 'PIN code cannot be empty',
      'string.pattern.base': 'PIN code must be a valid 6-digit number',
    }),

  landmark: Joi.string().trim().max(255).allow('', null)
    .messages({
      'string.base': 'Landmark must be a string',
      'string.max': 'Landmark must not exceed 255 characters',
    }),

  label: Joi.string().trim().valid('home', 'work', 'other')
    .messages({
      'any.only': 'Label must be one of home, work, or other',
    }),

  is_default: Joi.boolean()
    .messages({
      'boolean.base': 'is_default must be a boolean',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Returns an Express middleware that validates req.body against the given
 * Joi schema. On failure it responds with 400 and an errors array.
 * On success req.body is replaced with the sanitised, coerced value.
 *
 * @param {import('joi').ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return function validationMiddleware(req, res, next) {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.body = value;
    next();
  };
}

const validateCreateAddress = validate(createAddressSchema);
const validateUpdateAddress = validate(updateAddressSchema);

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  validateCreateAddress,
  validateUpdateAddress,
};
