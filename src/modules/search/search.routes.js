'use strict';

const { Router } = require('express');
const searchController = require('./search.controller');
const { validateSearch, validateSuggest } = require('./search.validator');

const router = Router();

/**
 * GET /search
 * Full-text search with faceted filter aggregations.
 */
router.get('/', validateSearch, searchController.search);

/**
 * GET /search/suggest
 * Autocomplete / suggestion queries.
 */
router.get('/suggest', validateSuggest, searchController.suggest);

module.exports = router;
