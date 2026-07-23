'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

/**
 * JWT verification middleware.
 * Verifies the Bearer token from the Authorization header and attaches
 * the decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      code: 'MISSING_TOKEN',
      message: 'Authorization token is required.',
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Authorization token has expired.',
      });
    }

    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Authorization token is invalid.',
    });
  }
}

module.exports = authenticate;
