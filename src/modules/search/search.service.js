'use strict';

const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const INDEX = process.env.ELASTICSEARCH_INDEX || 'catalog';

/**
 * Builds the Elasticsearch bool query for full-text search.
 * @param {string} q
 * @returns {object}
 */
function buildMatchQuery(q) {
  if (!q || q.trim() === '') {
    return { match_all: {} };
  }
  return {
    multi_match: {
      query: q,
      fields: ['name^3', 'description^1', 'tags^2', 'brand^2'],
      type: 'best_fields',
      fuzziness: 'AUTO',
      prefix_length: 1,
    },
  };
}

/**
 * Converts a plain filters object into an array of Elasticsearch term/terms clauses.
 * @param {object} filters  e.g. { category: 'electronics', brand: ['sony','lg'] }
 * @returns {Array}
 */
function buildFilterClauses(filters) {
  return Object.entries(filters).reduce((clauses, [field, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      clauses.push({ terms: { [`${field}.keyword`]: value } });
    } else if (!Array.isArray(value) && value !== undefined && value !== null && value !== '') {
      clauses.push({ term: { [`${field}.keyword`]: value } });
    }
    return clauses;
  }, []);
}

/**
 * Full-text search with faceted aggregations.
 *
 * @param {object} params
 * @param {string}  params.q        - Search query string.
 * @param {object}  params.filters  - Key/value pairs for facet filtering.
 * @param {number}  params.page     - 1-based page number.
 * @param {number}  params.size     - Page size (hits per page).
 * @returns {Promise<object>}
 */
async function search({ q = '', filters = {}, page = 1, size = 10 }) {
  const from = (page - 1) * size;
  const filterClauses = buildFilterClauses(filters);

  const body = {
    from,
    size,
    query: {
      bool: {
        must: buildMatchQuery(q),
        filter: filterClauses,
      },
    },
    aggs: {
      categories: {
        terms: { field: 'category.keyword', size: 30 },
      },
      brands: {
        terms: { field: 'brand.keyword', size: 30 },
      },
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { key: 'under_25',   to: 25 },
            { key: '25_to_50',   from: 25,  to: 50 },
            { key: '50_to_100',  from: 50,  to: 100 },
            { key: '100_to_200', from: 100, to: 200 },
            { key: 'over_200',   from: 200 },
          ],
        },
      },
      avg_rating: {
        avg: { field: 'rating' },
      },
    },
    highlight: {
      fields: {
        name: {},
        description: { number_of_fragments: 2, fragment_size: 150 },
      },
    },
  };

  const response = await client.search({ index: INDEX, body });
  const { hits, aggregations } = response.body || response;

  return {
    total: typeof hits.total === 'object' ? hits.total.value : hits.total,
    page,
    size,
    results: hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      highlight: hit.highlight || {},
      ...hit._source,
    })),
    facets: {
      categories: aggregations.categories.buckets,
      brands: aggregations.brands.buckets,
      price_ranges: aggregations.price_ranges.buckets,
      avg_rating: aggregations.avg_rating.value,
    },
  };
}

/**
 * Autocomplete suggestions using Elasticsearch completion suggester.
 *
 * @param {object} params
 * @param {string} params.q    - Prefix string typed by the user.
 * @param {number} params.size - Maximum number of suggestions to return.
 * @returns {Promise<object>}
 */
async function suggest({ q, size = 5 }) {
  const body = {
    suggest: {
      autocomplete: {
        prefix: q,
        completion: {
          field: 'suggest',
          size,
          fuzzy: {
            fuzziness: 1,
            min_length: 3,
          },
          skip_duplicates: true,
        },
      },
    },
    _source: ['name', 'category', 'imageUrl'],
  };

  const response = await client.search({ index: INDEX, body });
  const { suggest: suggestResult } = response.body || response;

  const options = (suggestResult.autocomplete[0].options || []).map((opt) => ({
    id: opt._id,
    text: opt.text,
    score: opt._score,
    name: opt._source.name,
    category: opt._source.category,
    imageUrl: opt._source.imageUrl || null,
  }));

  return { q, suggestions: options };
}

module.exports = { search, suggest };
