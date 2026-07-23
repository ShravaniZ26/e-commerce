const crypto = require('crypto');

const TOKEN_BYTE_LENGTH = 32;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generates a cryptographically secure random reset token.
 *
 * @returns {{ rawToken: string, hashedToken: string, expiresAt: Date }}
 *   rawToken   - Hex string to send to the user (never stored)
 *   hashedToken - SHA-256 hex digest to persist in the database
 *   expiresAt  - Expiry timestamp (1 hour from generation)
 */
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  return { rawToken, hashedToken, expiresAt };
};

/**
 * Hashes a raw token using SHA-256.
 *
 * @param {string} rawToken - Plain hex token received from the user
 * @returns {string} SHA-256 hex digest
 */
const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Verifies that a raw token matches a stored hash and has not expired.
 *
 * @param {string} rawToken    - Plain token provided by the user
 * @param {string} storedHash  - SHA-256 hash stored in the database
 * @param {Date}   expiresAt   - Expiry timestamp stored in the database
 * @returns {boolean} True if the token is valid and unexpired
 */
const verifyResetToken = (rawToken, storedHash, expiresAt) => {
  if (!rawToken || !storedHash || !expiresAt) {
    return false;
  }

  const candidateHash = hashToken(rawToken);

  const hashesMatch = crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );

  const notExpired = new Date() < new Date(expiresAt);

  return hashesMatch && notExpired;
};

module.exports = {
  generateResetToken,
  hashToken,
  verifyResetToken,
  TOKEN_BYTE_LENGTH,
  TOKEN_EXPIRY_MS,
};
