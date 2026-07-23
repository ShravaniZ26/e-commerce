'use strict';

const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

const updateProfileSchema = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
];

const changePasswordSchema = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const updateUserSchema = [
  param('userId').isUUID().withMessage('Invalid user ID'),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
    .toBoolean(),
];

const userIdParamSchema = [
  param('userId').isUUID().withMessage('Invalid user ID'),
];

const getUsersQuerySchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must not exceed 255 characters'),
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
    .toBoolean(),
];

const createAddressSchema = [
  body('label')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Label must not exceed 100 characters'),
  body('line1')
    .notEmpty()
    .withMessage('Address line 1 is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 1 must not exceed 255 characters'),
  body('line2')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 2 must not exceed 255 characters'),
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters'),
  body('state')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters'),
  body('postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
    .trim()
    .isLength({ max: 20 })
    .withMessage('Postal code must not exceed 20 characters'),
  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
    .toBoolean(),
];

const updateAddressSchema = [
  param('addressId').isUUID().withMessage('Invalid address ID'),
  body('label')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Label must not exceed 100 characters'),
  body('line1')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address line 1 cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Address line 1 must not exceed 255 characters'),
  body('line2')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 2 must not exceed 255 characters'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty')
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters'),
  body('state')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters'),
  body('postalCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Postal code cannot be empty')
    .isLength({ max: 20 })
    .withMessage('Postal code must not exceed 20 characters'),
  body('country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
    .toBoolean(),
];

const addressIdParamSchema = [
  param('addressId').isUUID().withMessage('Invalid address ID'),
];

module.exports = {
  handleValidation,
  updateProfileSchema,
  changePasswordSchema,
  updateUserSchema,
  userIdParamSchema,
  getUsersQuerySchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
};
