'use strict';

const { query, validationResult } = require('express-validator');

/**
 * Allowed sort field identifiers.
 */
const ALLOWED_SORT_FIELDS = ['relevance', 'price_asc', 'price_desc', 'rating', 'newest'];

/**
 * Validation rules for GET /search
 */
const validateSearch = [
  query('q')
    .optional()
    .isString()
    .withMessage('q must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('q must not exceed 500 characters'),

  query('filters')
    .optional()
    .isString()
    .withMessage('filters must be a JSON-encoded string')
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          throw new Error();
        }
        return true;
      } catch {
        throw new Error('filters must be a valid JSON object');
      }
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1')
    .toInt(),

  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('size must be an integer between 1 and 100')
    .toInt(),

  query('sort')
    .optional()
    .isString()
    .withMessage('sort must be a string')
    .isIn(ALLOWED_SORT_FIELDS)
    .withMessage(`sort must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`),
];

/**
 * Validation rules for GET /search/suggest
 */
const validateSuggest = [
  query('q')
    .notEmpty()
    .withMessage('q is required')
    .isString()
    .withMessage('q must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('q must be between 1 and 200 characters'),

  query('size')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('size must be an integer between 1 and 20')
    .toInt(),
];

module.exports = { validateSearch, validateSuggest, validationResult };
