'use strict';

const Joi = require('joi');

// ── Reusable sub-schemas ──────────────────────────────────────────────────────

/**
 * Postal address used for both shipping and billing.
 */
const addressSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required().messages({
    'string.base': 'First name must be a string',
    'string.empty': 'First name is required',
    'string.max': 'First name must not exceed 100 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().trim().min(1).max(100).required().messages({
    'string.base': 'Last name must be a string',
    'string.empty': 'Last name is required',
    'string.max': 'Last name must not exceed 100 characters',
    'any.required': 'Last name is required',
  }),
  line1: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'Address line 1 must be a string',
    'string.empty': 'Address line 1 is required',
    'string.max': 'Address line 1 must not exceed 255 characters',
    'any.required': 'Address line 1 is required',
  }),
  line2: Joi.string().trim().max(255).optional().allow('').messages({
    'string.max': 'Address line 2 must not exceed 255 characters',
  }),
  city: Joi.string().trim().min(1).max(100).required().messages({
    'string.base': 'City must be a string',
    'string.empty': 'City is required',
    'string.max': 'City must not exceed 100 characters',
    'any.required': 'City is required',
  }),
  state: Joi.string().trim().min(1).max(100).required().messages({
    'string.base': 'State/province must be a string',
    'string.empty': 'State/province is required',
    'string.max': 'State/province must not exceed 100 characters',
    'any.required': 'State/province is required',
  }),
  postalCode: Joi.string().trim().min(1).max(20).required().messages({
    'string.base': 'Postal code must be a string',
    'string.empty': 'Postal code is required',
    'string.max': 'Postal code must not exceed 20 characters',
    'any.required': 'Postal code is required',
  }),
  country: Joi.string().trim().length(2).uppercase().required().messages({
    'string.base': 'Country must be a string',
    'string.empty': 'Country is required',
    'string.length': 'Country must be a valid 2-letter ISO 3166-1 alpha-2 code',
    'any.required': 'Country is required',
  }),
  phone: Joi.string().trim().max(30).optional().allow('').messages({
    'string.max': 'Phone number must not exceed 30 characters',
  }),
});

// ── Endpoint schemas ──────────────────────────────────────────────────────────

/**
 * POST /checkout/start (alias: /checkout/initiate)
 */
const startCheckoutSchema = Joi.object({
  cartId: Joi.string().trim().required().messages({
    'string.base': 'Cart ID must be a string',
    'string.empty': 'Cart ID is required',
    'any.required': 'Cart ID is required',
  }),
  guestEmail: Joi.string().email().lowercase().optional().messages({
    'string.email': 'Guest email must be a valid email address',
  }),
  guestToken: Joi.string().trim().optional(),
});

/**
 * POST /checkout/address
 */
const saveAddressSchema = Joi.object({
  checkoutId: Joi.string().uuid().required().messages({
    'string.base': 'Checkout ID must be a string',
    'string.empty': 'Checkout ID is required',
    'string.guid': 'Checkout ID must be a valid UUID',
    'any.required': 'Checkout ID is required',
  }),
  shippingAddress: addressSchema.required().messages({
    'any.required': 'Shipping address is required',
  }),
  billingAddress: addressSchema.optional(),
  sameAsBilling: Joi.boolean().default(true),
});

/**
 * POST /checkout/place-order (alias: /checkout/confirm)
 */
const placeOrderSchema = Joi.object({
  checkoutId: Joi.string().uuid().required().messages({
    'string.base': 'Checkout ID must be a string',
    'string.empty': 'Checkout ID is required',
    'string.guid': 'Checkout ID must be a valid UUID',
    'any.required': 'Checkout ID is required',
  }),
  paymentMethodId: Joi.string().trim().required().messages({
    'string.base': 'Payment method ID must be a string',
    'string.empty': 'Payment method ID is required',
    'any.required': 'Payment method ID is required',
  }),
  promoCode: Joi.string().trim().uppercase().optional().allow(''),
});

// ── Middleware factory ────────────────────────────────────────────────────────

/**
 * Builds an Express middleware function that validates req.body against the
 * supplied Joi schema. On failure it returns a 422 response with per-field
 * error detail. On success it replaces req.body with the sanitised value and
 * calls next().
 *
 * @param {Joi.ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
function makeValidator(schema) {
  return function validate(req, res, next) {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(422).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.body = value;
    return next();
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  validateStartCheckout: makeValidator(startCheckoutSchema),
  validateSaveAddress: makeValidator(saveAddressSchema),
  validatePlaceOrder: makeValidator(placeOrderSchema),
};
