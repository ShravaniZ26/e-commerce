'use strict';

const Joi = require('joi');

const createCartSchema = Joi.object({
  userId: Joi.string().uuid().optional().allow(null, ''),
  sessionId: Joi.string().optional().allow(null, ''),
});

const addItemSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'any.required': 'productId is required',
    'string.base': 'productId must be a string',
    'string.guid': 'productId must be a valid UUID',
    'string.empty': 'productId cannot be empty',
  }),
  variantId: Joi.string().uuid().optional().allow(null, '').messages({
    'string.guid': 'variantId must be a valid UUID',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'quantity is required',
    'number.base': 'quantity must be a number',
    'number.integer': 'quantity must be an integer',
    'number.min': 'quantity must be at least 1',
  }),
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required().messages({
    'any.required': 'quantity is required',
    'number.base': 'quantity must be a number',
    'number.integer': 'quantity must be an integer',
    'number.min': 'quantity must be at least 0',
  }),
});

const applyPromoSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50).required().messages({
    'any.required': 'Promo code is required',
    'string.base': 'Promo code must be a string',
    'string.empty': 'Promo code cannot be empty',
    'string.min': 'Promo code must not be empty',
    'string.max': 'Promo code must not exceed 50 characters',
  }),
});

function makeValidator(schema) {
  return function validateMiddleware(req, res, next) {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    req.body = value;
    return next();
  };
}

const validateCreateCart = makeValidator(createCartSchema);
const validateAddItem = makeValidator(addItemSchema);
const validateUpdateItem = makeValidator(updateItemSchema);
const validateApplyPromo = makeValidator(applyPromoSchema);

module.exports = {
  createCartSchema,
  addItemSchema,
  updateItemSchema,
  applyPromoSchema,
  validateCreateCart,
  validateAddItem,
  validateUpdateItem,
  validateApplyPromo,
};
