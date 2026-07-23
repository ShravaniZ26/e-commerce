'use strict';

const { Client } = require('@elastic/elasticsearch');

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _client = null;

/**
 * Initialise (or return the existing) Elasticsearch client.
 *
 * @param {object} [options]
 * @param {string} [options.node]       - ES node URL (falls back to ES_NODE env var or localhost:9200)
 * @param {string} [options.username]   - HTTP-auth username (falls back to ES_USERNAME env var)
 * @param {string} [options.password]   - HTTP-auth password (falls back to ES_PASSWORD env var)
 * @param {string} [options.apiKey]     - Base64-encoded API key (falls back to ES_API_KEY env var)
 * @param {object} [options.tls]        - TLS options passed straight to the client
 * @returns {Client}
 */
function getClient(options = {}) {
  if (_client) return _client;

  const node = options.node || process.env.ES_NODE || 'http://localhost:9200';

  const clientOptions = { node };

  const apiKey = options.apiKey || process.env.ES_API_KEY;
  if (apiKey) {
    clientOptions.auth = { apiKey };
  } else {
    const username = options.username || process.env.ES_USERNAME;
    const password = options.password || process.env.ES_PASSWORD;
    if (username && password) {
      clientOptions.auth = { username, password };
    }
  }

  if (options.tls) {
    clientOptions.tls = options.tls;
  }

  _client = new Client(clientOptions);
  return _client;
}

/**
 * Override the internal client (useful for testing with mocks).
 *
 * @param {Client} client
 */
function setClient(client) {
  _client = client;
}

// ---------------------------------------------------------------------------
// Index mapping helpers
// ---------------------------------------------------------------------------

/**
 * Build a standard index configuration object (settings + mappings).
 *
 * @param {object} params
 * @param {object} params.properties          - Field property definitions
 * @param {object} [params.settings]          - Optional index-level settings
 * @param {object} [params.dynamicTemplates]  - Optional dynamic templates array
 * @returns {object}
 */
function buildIndexConfig({ properties, settings = {}, dynamicTemplates = [] }) {
  const defaultSettings = {
    number_of_shards: 1,
    number_of_replicas: 1,
    'index.max_result_window': 10000,
  };

  const config = {
    settings: Object.assign({}, defaultSettings, settings),
    mappings: {
      dynamic: false,
      properties,
    },
  };

  if (dynamicTemplates.length > 0) {
    config.mappings.dynamic_templates = dynamicTemplates;
  }

  return config;
}

/**
 * Create an index if it does not already exist.
 *
 * @param {string} index
 * @param {object} config  - Result of buildIndexConfig()
 * @returns {Promise<{created: boolean}>}
 */
async function ensureIndex(index, config) {
  const client = getClient();
  const exists = await client.indices.exists({ index });

  if (exists) {
    return { created: false };
  }

  await client.indices.create({ index, body: config });
  return { created: true };
}

/**
 * Delete an index (ignores "index not found" errors).
 *
 * @param {string} index
 * @returns {Promise<void>}
 */
async function deleteIndex(index) {
  const client = getClient();
  try {
    await client.indices.delete({ index });
  } catch (err) {
    if (err.meta && err.meta.statusCode === 404) return;
    throw err;
  }
}

/**
 * Put (update) the mapping of an existing index.
 *
 * @param {string} index
 * @param {object} properties  - Field property definitions
 * @returns {Promise<void>}
 */
async function putMapping(index, properties) {
  const client = getClient();
  await client.indices.putMapping({ index, body: { properties } });
}

/**
 * Refresh one or more indices, making recent changes searchable immediately.
 *
 * @param {string|string[]} index
 * @returns {Promise<void>}
 */
async function refreshIndex(index) {
  const client = getClient();
  await client.indices.refresh({ index });
}

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

/**
 * Full-text match query.
 *
 * @param {string} field
 * @param {string} value
 * @param {object} [options]
 * @param {string} [options.operator]  - 'and' | 'or' (default 'or')
 * @param {number} [options.boost]
 * @returns {object}
 */
function matchQuery(field, value, options = {}) {
  const inner = { query: value };
  if (options.operator) inner.operator = options.operator;
  if (options.boost !== undefined) inner.boost = options.boost;
  return { match: { [field]: inner } };
}

/**
 * Multi-field full-text search.
 *
 * @param {string[]} fields
 * @param {string}   value
 * @param {object}  [options]
 * @param {string}  [options.type]       - 'best_fields' | 'most_fields' | 'cross_fields' | 'phrase'
 * @param {string}  [options.operator]   - 'and' | 'or'
 * @param {number}  [options.tieBreaker]
 * @returns {object}
 */
function multiMatchQuery(fields, value, options = {}) {
  const q = { query: value, fields };
  if (options.type) q.type = options.type;
  if (options.operator) q.operator = options.operator;
  if (options.tieBreaker !== undefined) q.tie_breaker = options.tieBreaker;
  return { multi_match: q };
}

/**
 * Exact-value term query.
 *
 * @param {string} field
 * @param {*}      value
 * @param {object} [options]
 * @param {number} [options.boost]
 * @returns {object}
 */
function termQuery(field, value, options = {}) {
  const inner = { value };
  if (options.boost !== undefined) inner.boost = options.boost;
  return { term: { [field]: inner } };
}

/**
 * Exact-value terms query (multiple values).
 *
 * @param {string} field
 * @param {Array}  values
 * @returns {object}
 */
function termsQuery(field, values) {
  return { terms: { [field]: values } };
}

/**
 * Range query.
 *
 * @param {string} field
 * @param {object} params
 * @param {*} [params.gt]   - greater than
 * @param {*} [params.gte]  - greater than or equal
 * @param {*} [params.lt]   - less than
 * @param {*} [params.lte]  - less than or equal
 * @param {string} [params.format] - date format
 * @returns {object}
 */
function rangeQuery(field, params) {
  return { range: { [field]: params } };
}

/**
 * Exists query — field must contain a non-null value.
 *
 * @param {string} field
 * @returns {object}
 */
function existsQuery(field) {
  return { exists: { field } };
}

/**
 * Prefix query.
 *
 * @param {string} field
 * @param {string} value
 * @param {object} [options]
 * @param {number} [options.boost]
 * @returns {object}
 */
function prefixQuery(field, value, options = {}) {
  const inner = { value };
  if (options.boost !== undefined) inner.boost = options.boost;
  return { prefix: { [field]: inner } };
}

/**
 * Wildcard query.
 *
 * @param {string} field
 * @param {string} pattern  - Supports * and ?
 * @returns {object}
 */
function wildcardQuery(field, pattern) {
  return { wildcard: { [field]: { value: pattern } } };
}

/**
 * Nested query.
 *
 * @param {string} path
 * @param {object} query  - Inner ES query object
 * @param {string} [scoreMode] - 'avg' | 'sum' | 'min' | 'max' | 'none'
 * @returns {object}
 */
function nestedQuery(path, query, scoreMode = 'avg') {
  return { nested: { path, query, score_mode: scoreMode } };
}

/**
 * Build a bool query.
 *
 * @param {object} clauses
 * @param {object|object[]} [clauses.must]               - Must match
 * @param {object|object[]} [clauses.should]             - Should match
 * @param {object|object[]} [clauses.mustNot]            - Must not match
 * @param {object|object[]} [clauses.filter]             - Filter (no scoring)
 * @param {number}          [clauses.minimumShouldMatch] - Min number of should clauses
 * @returns {object}
 */
function boolQuery({ must, should, mustNot, filter, minimumShouldMatch } = {}) {
  const bool = {};

  if (must) bool.must = Array.isArray(must) ? must : [must];
  if (should) bool.should = Array.isArray(should) ? should : [should];
  if (mustNot) bool.must_not = Array.isArray(mustNot) ? mustNot : [mustNot];
  if (filter) bool.filter = Array.isArray(filter) ? filter : [filter];
  if (minimumShouldMatch !== undefined) bool.minimum_should_match = minimumShouldMatch;

  return { bool };
}

/**
 * Build a standard sort array entry.
 *
 * @param {string} field
 * @param {'asc'|'desc'} [order='asc']
 * @param {object} [options]
 * @param {string} [options.mode]    - 'min' | 'max' | 'sum' | 'avg' | 'median'
 * @param {string} [options.missing] - '_last' | '_first' | custom value
 * @returns {object}
 */
function sortClause(field, order = 'asc', options = {}) {
  const inner = { order };
  if (options.mode) inner.mode = options.mode;
  if (options.missing !== undefined) inner.missing = options.missing;
  return { [field]: inner };
}

/**
 * Compose a full search body.
 *
 * @param {object} params
 * @param {object}   [params.query]         - ES query DSL object (default: match_all)
 * @param {object[]} [params.sort]          - Array of sort clauses
 * @param {object}   [params.aggs]          - Aggregations
 * @param {number}   [params.from]          - Pagination offset (default 0)
 * @param {number}   [params.size]          - Page size (default 10)
 * @param {string[]} [params.sourceIncludes] - Fields to include in _source
 * @param {string[]} [params.sourceExcludes] - Fields to exclude from _source
 * @param {object}   [params.highlight]     - Highlight specification
 * @returns {object}
 */
function buildSearchBody(params = {}) {
  const body = {};

  body.query = params.query || { match_all: {} };
  body.from = params.from !== undefined ? params.from : 0;
  body.size = params.size !== undefined ? params.size : 10;

  if (params.sort && params.sort.length > 0) body.sort = params.sort;
  if (params.aggs) body.aggs = params.aggs;
  if (params.highlight) body.highlight = params.highlight;

  if (params.sourceIncludes || params.sourceExcludes) {
    body._source = {};
    if (params.sourceIncludes) body._source.includes = params.sourceIncludes;
    if (params.sourceExcludes) body._source.excludes = params.sourceExcludes;
  }

  return body;
}

// ---------------------------------------------------------------------------
// Document operations
// ---------------------------------------------------------------------------

/**
 * Index (create or replace) a document.
 *
 * @param {string} index
 * @param {string} id
 * @param {object} document
 * @param {object} [options]
 * @param {string} [options.routing]
 * @param {string} [options.refresh]  - 'true' | 'false' | 'wait_for'
 * @returns {Promise<object>}
 */
async function indexDocument(index, id, document, options = {}) {
  const client = getClient();
  const params = { index, id, body: document };
  if (options.routing) params.routing = options.routing;
  if (options.refresh) params.refresh = options.refresh;
  const result = await client.index(params);
  return result.body || result;
}

/**
 * Get a single document by ID.
 *
 * @param {string} index
 * @param {string} id
 * @returns {Promise<object|null>}  The document source or null if not found
 */
async function getDocument(index, id) {
  const client = getClient();
  try {
    const result = await client.get({ index, id });
    const body = result.body || result;
    return body._source || null;
  } catch (err) {
    if (err.meta && err.meta.statusCode === 404) return null;
    throw err;
  }
}

/**
 * Partial update of a document.
 *
 * @param {string} index
 * @param {string} id
 * @param {object} partial   - Fields to update
 * @param {object} [options]
 * @param {string} [options.refresh]
 * @returns {Promise<object>}
 */
async function updateDocument(index, id, partial, options = {}) {
  const client = getClient();
  const params = { index, id, body: { doc: partial } };
  if (options.refresh) params.refresh = options.refresh;
  const result = await client.update(params);
  return result.body || result;
}

/**
 * Delete a document by ID.
 *
 * @param {string} index
 * @param {string} id
 * @param {object} [options]
 * @param {string} [options.refresh]
 * @returns {Promise<void>}
 */
async function deleteDocument(index, id, options = {}) {
  const client = getClient();
  const params = { index, id };
  if (options.refresh) params.refresh = options.refresh;
  try {
    await client.delete(params);
  } catch (err) {
    if (err.meta && err.meta.statusCode === 404) return;
    throw err;
  }
}

/**
 * Bulk index / update / delete helper.
 *
 * @param {Array<{action: 'index'|'update'|'delete', index: string, id: string, body?: object}>} operations
 * @param {object} [options]
 * @param {string} [options.refresh]
 * @returns {Promise<{errors: boolean, items: Array}>}
 */
async function bulkOperation(operations, options = {}) {
  const client = getClient();
  const body = [];

  for (const op of operations) {
    const meta = { _index: op.index, _id: op.id };

    if (op.action === 'index') {
      body.push({ index: meta });
      body.push(op.body);
    } else if (op.action === 'update') {
      body.push({ update: meta });
      body.push({ doc: op.body });
    } else if (op.action === 'delete') {
      body.push({ delete: meta });
    }
  }

  if (body.length === 0) return { errors: false, items: [] };

  const params = { body };
  if (options.refresh) params.refresh = options.refresh;

  const result = await client.bulk(params);
  const responseBody = result.body || result;
  return { errors: responseBody.errors, items: responseBody.items };
}

// ---------------------------------------------------------------------------
// Search operations
// ---------------------------------------------------------------------------

/**
 * Execute a search request.
 *
 * @param {string|string[]} index
 * @param {object}          body    - Result of buildSearchBody()
 * @param {object}          [options]
 * @param {string}          [options.routing]
 * @param {string}          [options.preference]
 * @param {boolean}         [options.trackTotalHits]
 * @returns {Promise<{total: number, hits: Array<{id: string, score: number, source: object}>, aggregations: object|undefined}>}
 */
async function search(index, body, options = {}) {
  const client = getClient();
  const params = { index, body };

  if (options.routing) params.routing = options.routing;
  if (options.preference) params.preference = options.preference;
  if (options.trackTotalHits !== undefined) {
    params.track_total_hits = options.trackTotalHits;
  }

  const result = await client.search(params);
  const responseBody = result.body || result;
  const hitsData = responseBody.hits;

  const total =
    typeof hitsData.total === 'object' ? hitsData.total.value : hitsData.total;

  const hits = (hitsData.hits || []).map((hit) => ({
    id: hit._id,
    index: hit._index,
    score: hit._score,
    source: hit._source,
    highlight: hit.highlight,
  }));

  return {
    total,
    hits,
    aggregations: responseBody.aggregations,
  };
}

/**
 * Count documents matching a query.
 *
 * @param {string} index
 * @param {object} [query]  - ES query DSL (default: match_all)
 * @returns {Promise<number>}
 */
async function count(index, query = { match_all: {} }) {
  const client = getClient();
  const result = await client.count({ index, body: { query } });
  const responseBody = result.body || result;
  return responseBody.count;
}

/**
 * Scroll through large result sets.
 *
 * @param {string}   index
 * @param {object}   body          - Search body
 * @param {Function} onBatch       - Async callback invoked per batch: (hits) => Promise<void>
 * @param {object}   [options]
 * @param {string}   [options.scroll]     - Scroll context TTL (default '2m')
 * @param {number}   [options.batchSize]  - Docs per batch (default 100)
 * @returns {Promise<number>}  Total documents processed
 */
async function scrollSearch(index, body, onBatch, options = {}) {
  const client = getClient();
  const scrollTtl = options.scroll || '2m';
  const batchSize = options.batchSize || 100;

  const scrollBody = Object.assign({}, body, { size: batchSize });

  let result = await client.search({
    index,
    scroll: scrollTtl,
    body: scrollBody,
  });

  let responseBody = result.body || result;
  let scrollId = responseBody._scroll_id;
  let total = 0;

  try {
    while (true) {
      const hits = (responseBody.hits && responseBody.hits.hits) || [];
      if (hits.length === 0) break;

      const mapped = hits.map((hit) => ({
        id: hit._id,
        index: hit._index,
        score: hit._score,
        source: hit._source,
      }));

      await onBatch(mapped);
      total += mapped.length;

      result = await client.scroll({ scroll_id: scrollId, scroll: scrollTtl });
      responseBody = result.body || result;
      scrollId = responseBody._scroll_id;
    }
  } finally {
    if (scrollId) {
      await client.clearScroll({ body: { scroll_id: scrollId } }).catch(() => {});
    }
  }

  return total;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Client management
  getClient,
  setClient,

  // Index helpers
  buildIndexConfig,
  ensureIndex,
  deleteIndex,
  putMapping,
  refreshIndex,

  // Query builders
  matchQuery,
  multiMatchQuery,
  termQuery,
  termsQuery,
  rangeQuery,
  existsQuery,
  prefixQuery,
  wildcardQuery,
  nestedQuery,
  boolQuery,
  sortClause,
  buildSearchBody,

  // Document operations
  indexDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  bulkOperation,

  // Search operations
  search,
  count,
  scrollSearch,
};
