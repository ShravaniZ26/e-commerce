'use strict';

/**
 * RBAC middleware factory.
 * Returns a middleware function that checks whether req.user has the
 * required role before allowing the request to proceed.
 *
 * @param {string|string[]} role - Required role(s). The user must possess
 *   at least one of the listed roles.
 * @returns {Function} Express middleware
 */
function authorize(role) {
  const required = Array.isArray(role) ? role : [role];

  return function rbacMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required to access this resource.',
      });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role].filter(Boolean);

    const hasRole = required.some((r) => userRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      });
    }

    return next();
  };
}

module.exports = authorize;
