const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parses and validates page/limit query parameters.
 *
 * @param {object} query - Express req.query object
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }

  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Builds the offset for a SQL/ORM query from page and limit values.
 *
 * @param {number} page  - Current page (1-based)
 * @param {number} limit - Items per page
 * @returns {number} Offset
 */
const buildOffset = (page, limit) => (page - 1) * limit;

/**
 * Formats a paginated API response envelope.
 *
 * @param {Array}  data        - Array of items for the current page
 * @param {number} total       - Total number of matching records
 * @param {number} page        - Current page (1-based)
 * @param {number} limit       - Items per page
 * @returns {object} Paginated response object
 */
const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  parsePagination,
  buildOffset,
  formatPaginatedResponse,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
