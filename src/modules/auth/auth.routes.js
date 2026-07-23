'use strict';

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  guestRegisterSchema,
  validate,
} = require('./auth.validator');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/guest-register', validate(guestRegisterSchema), authController.guestRegister);

module.exports = router;
