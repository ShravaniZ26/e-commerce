'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Reusable field definitions
// ---------------------------------------------------------------------------

const slugField = Joi.string()
  .trim()
  .lowercase()
  .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(255)
  .messages({
    'string.empty': 'Slug is required',
    'any.required': 'Slug is required',
    'string.pattern.base': 'Slug may only contain lowercase letters, numbers, and hyphens',
    'string.max': 'Slug must not exceed 255 characters',
  });

// ---------------------------------------------------------------------------
// Product schemas
// ---------------------------------------------------------------------------

const productCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Product name is required',
    'any.required': 'Product name is required',
    'string.max': 'Product name must not exceed 255 characters',
  }),
  slug: slugField.required(),
  description: Joi.string().trim().max(5000).allow('', null).optional(),
  brand_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Brand is required',
    'number.base': 'Brand ID must be a number',
    'number.positive': 'Brand ID must be a positive number',
  }),
  category_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Category is required',
    'number.base': 'Category ID must be a number',
    'number.positive': 'Category ID must be a positive number',
  }),
  base_price: Joi.number().precision(2).positive().required().messages({
    'any.required': 'Base price is required',
    'number.base': 'Base price must be a number',
    'number.positive': 'Base price must be a positive number',
  }),
  status: Joi.string().valid('active', 'draft', 'archived').default('draft').messages({
    'any.only': 'Status must be one of active, draft, archived',
  }),
});

const productUpdateSchema = productCreateSchema.fork(
  ['name', 'slug', 'brand_id', 'category_id', 'base_price'],
  (field) => field.optional()
);

// ---------------------------------------------------------------------------
// SKU schemas
// ---------------------------------------------------------------------------

const skuCreateSchema = Joi.object({
  sku_code: Joi.string().trim().uppercase().max(100).required().messages({
    'string.empty': 'SKU code is required',
    'any.required': 'SKU code is required',
    'string.max': 'SKU code must not exceed 100 characters',
  }),
  price: Joi.number().precision(2).positive().required().messages({
    'any.required': 'SKU price is required',
    'number.base': 'SKU price must be a number',
    'number.positive': 'SKU price must be a positive number',
  }),
  stock_quantity: Joi.number().integer().min(0).required().messages({
    'any.required': 'Stock quantity is required',
    'number.base': 'Stock quantity must be a number',
    'number.integer': 'Stock quantity must be an integer',
    'number.min': 'Stock quantity cannot be negative',
  }),
  attributes: Joi.object().optional().default({}),
  is_active: Joi.boolean().default(true),
});

const skuUpdateSchema = skuCreateSchema.fork(
  ['sku_code', 'price', 'stock_quantity'],
  (field) => field.optional()
);

// ---------------------------------------------------------------------------
// Category schemas
// ---------------------------------------------------------------------------

const categoryCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required',
    'string.max': 'Category name must not exceed 255 characters',
  }),
  slug: slugField.required(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  parent_id: Joi.number().integer().positive().allow(null).optional().messages({
    'number.base': 'Parent category ID must be a number',
    'number.positive': 'Parent category ID must be a positive number',
  }),
  is_active: Joi.boolean().default(true),
});

const categoryUpdateSchema = categoryCreateSchema.fork(
  ['name', 'slug'],
  (field) => field.optional()
);

// ---------------------------------------------------------------------------
// Brand schemas
// ---------------------------------------------------------------------------

const brandCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Brand name is required',
    'any.required': 'Brand name is required',
    'string.max': 'Brand name must not exceed 255 characters',
  }),
  slug: slugField.required(),
  logo_url: Joi.string().uri().max(2048).allow('', null).optional().messages({
    'string.uri': 'Logo URL must be a valid URL',
    'string.max': 'Logo URL must not exceed 2048 characters',
  }),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  is_active: Joi.boolean().default(true),
});

const brandUpdateSchema = brandCreateSchema.fork(
  ['name', 'slug'],
  (field) => field.optional()
);

// ---------------------------------------------------------------------------
// Product image schema
// ---------------------------------------------------------------------------

const productImageSchema = Joi.object({
  url: Joi.string().uri().max(2048).required().messages({
    'string.empty': 'Image URL is required',
    'any.required': 'Image URL is required',
    'string.uri': 'Image URL must be a valid URL',
    'string.max': 'Image URL must not exceed 2048 characters',
  }),
  alt_text: Joi.string().trim().max(255).allow('', null).optional(),
  sort_order: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Sort order cannot be negative',
  }),
  is_primary: Joi.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Product list query schema
// ---------------------------------------------------------------------------

const productListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category_id: Joi.number().integer().positive().optional(),
  brand_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('active', 'draft', 'archived').optional(),
  search: Joi.string().trim().max(255).optional(),
  sort_by: Joi.string().valid('name', 'base_price', 'created_at').default('created_at'),
  sort_dir: Joi.string().valid('asc', 'desc').default('desc'),
  min_price: Joi.number().precision(2).min(0).optional(),
  max_price: Joi.number().precision(2).min(0).optional(),
  is_active: Joi.boolean().optional(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.details.map((detail) => ({
          field: detail.context && detail.context.key ? detail.context.key : null,
          message: detail.message,
        })),
      });
    }

    req[source] = value;
    return next();
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  validateCreateProduct: validate(productCreateSchema),
  validateUpdateProduct: validate(productUpdateSchema),
  validateCreateSku: validate(skuCreateSchema),
  validateUpdateSku: validate(skuUpdateSchema),
  validateCreateCategory: validate(categoryCreateSchema),
  validateUpdateCategory: validate(categoryUpdateSchema),
  validateCreateBrand: validate(brandCreateSchema),
  validateUpdateBrand: validate(brandUpdateSchema),
  validateProductImage: validate(productImageSchema),
  validateProductListQuery: validate(productListQuerySchema, 'query'),
};
