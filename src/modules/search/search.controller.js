'use strict';

const { validationResult } = require('express-validator');
const searchService = require('./search.service');

/**
 * GET /search
 * Executes a full-text search and returns paginated hits plus facet aggregations.
 */
async function search(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { q = '', filters, page, size } = req.query;

    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch {
        return res.status(422).json({
          errors: [{ param: 'filters', msg: 'filters must be a valid JSON object' }],
        });
      }
    }

    const result = await searchService.search({
      q,
      filters: parsedFilters,
      page: parseInt(page, 10),
      size: parseInt(size, 10),
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /search/suggest
 * Returns autocomplete suggestions for the given prefix query.
 */
async function suggest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { q, size } = req.query;

    const result = await searchService.suggest({
      q,
      size: size ? parseInt(size, 10) : 5,
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { search, suggest };
