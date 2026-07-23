'use strict';

const authService = require('./auth.service');

/**
 * Extract Bearer token from Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    const result = await authService.logout(token);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/guest-register
 */
const guestRegister = async (req, res, next) => {
  try {
    const result = await authService.guestRegister(req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};
