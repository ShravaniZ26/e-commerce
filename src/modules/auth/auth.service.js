'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models/user.model');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

/**
 * In-memory token blacklist for logout.
 * Replace with a Redis-backed store in production.
 * @type {Set<string>}
 */
const tokenBlacklist = new Set();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  isGuest: Boolean(user.isGuest),
});

const createHttpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

/**
 * Register a new full (non-guest) user.
 * @param {{ name: string, email: string, password: string }} payload
 */
const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw createHttpError('Email is already registered.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, isGuest: false });

  const token = generateAccessToken({ userId: user.id, email: user.email });
  return { token, user: sanitizeUser(user) };
};

/**
 * Authenticate a user and return a JWT.
 * @param {{ email: string, password: string }} payload
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw createHttpError('Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw createHttpError('Invalid email or password.', 401);
  }

  const token = generateAccessToken({ userId: user.id, email: user.email });
  return { token, user: sanitizeUser(user) };
};

/**
 * Invalidate the provided JWT by adding it to the blacklist.
 * @param {string|null} token
 */
const logout = async (token) => {
  if (token) {
    tokenBlacklist.add(token);
  }
  return { message: 'Logged out successfully.' };
};

/**
 * Check whether a token has been blacklisted.
 * @param {string} token
 * @returns {boolean}
 */
const isTokenBlacklisted = (token) => tokenBlacklist.has(token);

/**
 * Initiate a password-reset flow by generating a secure reset token.
 * Always responds with the same message to prevent email enumeration.
 * @param {{ email: string }} payload
 */
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ where: { email } });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);

    await user.update({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: tokenExpires,
    });

    // Integrate with your email service to send rawToken to the user.
    // e.g. emailService.sendPasswordReset(user.email, rawToken);
  }

  return { message: 'If that email is registered, a reset link has been sent.' };
};

/**
 * Complete the password-reset flow by verifying the token and setting a new password.
 * @param {{ token: string, password: string }} payload
 */
const resetPassword = async ({ token, password }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ where: { resetPasswordToken: tokenHash } });

  if (!user || !user.resetPasswordExpires || new Date() > new Date(user.resetPasswordExpires)) {
    throw createHttpError('Password reset token is invalid or has expired.', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await user.update({
    passwordHash,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  return { message: 'Password has been reset successfully.' };
};

/**
 * Register an anonymous guest session.
 * Creates a temporary user record with a generated email and password.
 * @param {{ name?: string }} payload
 */
const guestRegister = async ({ name } = {}) => {
  const uniqueSuffix = crypto.randomBytes(8).toString('hex');
  const guestEmail = `guest_${uniqueSuffix}@guest.local`;
  const guestPassword = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(guestPassword, SALT_ROUNDS);

  const user = await User.create({
    name: name || 'Guest',
    email: guestEmail,
    passwordHash,
    isGuest: true,
  });

  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    isGuest: true,
  });

  return { token, user: sanitizeUser(user) };
};

module.exports = {
  register,
  login,
  logout,
  isTokenBlacklisted,
  forgotPassword,
  resetPassword,
  guestRegister,
};
