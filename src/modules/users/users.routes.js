'use strict';

const { Router } = require('express');
const controller = require('./users.controller');
const validator = require('./users.validator');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

const router = Router();

// ─── Profile routes (authenticated) ──────────────────────────────────────────

router.get('/me', authenticate, controller.getMe);

router.patch(
  '/me',
  authenticate,
  validator.updateProfileSchema,
  validator.handleValidation,
  controller.updateMe
);

router.post(
  '/me/change-password',
  authenticate,
  validator.changePasswordSchema,
  validator.handleValidation,
  controller.changePassword
);

// ─── Address book routes (authenticated) ─────────────────────────────────────

router.get('/me/addresses', authenticate, controller.getAddresses);

router.post(
  '/me/addresses',
  authenticate,
  validator.createAddressSchema,
  validator.handleValidation,
  controller.createAddress
);

router.patch(
  '/me/addresses/:addressId',
  authenticate,
  validator.updateAddressSchema,
  validator.handleValidation,
  controller.updateAddress
);

router.delete(
  '/me/addresses/:addressId',
  authenticate,
  validator.addressIdParamSchema,
  validator.handleValidation,
  controller.deleteAddress
);

// ─── Admin routes ─────────────────────────────────────────────────────────────

router.get(
  '/',
  authenticate,
  authorize('admin'),
  validator.getUsersQuerySchema,
  validator.handleValidation,
  controller.getUsers
);

router.get(
  '/:userId',
  authenticate,
  authorize('admin'),
  validator.userIdParamSchema,
  validator.handleValidation,
  controller.getUserById
);

router.patch(
  '/:userId',
  authenticate,
  authorize('admin'),
  validator.updateUserSchema,
  validator.handleValidation,
  controller.updateUser
);

router.delete(
  '/:userId',
  authenticate,
  authorize('admin'),
  validator.userIdParamSchema,
  validator.handleValidation,
  controller.deleteUser
);

module.exports = router;
