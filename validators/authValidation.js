import { body } from 'express-validator';

export const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ min: 2, max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ min: 2, max: 50 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
  // phone is optional — accept any non-empty string, skip format check to avoid locale issues
  body('phone').optional({ values: 'falsy' }).isString().withMessage('Invalid phone number'),
  body('acceptTerms').custom((value) => {
    if (value !== true && value !== 'true') {
      throw new Error('You must accept the terms and conditions');
    }
    return true;
  }),
  // seller-specific fields — all optional at validation level, controller handles logic
  body('role').optional().isIn(['customer', 'seller']).withMessage('Invalid role'),
  body('storeName').optional({ values: 'falsy' }).isString().isLength({ min: 2, max: 100 }).withMessage('Store name must be between 2 and 100 characters'),
  body('storeDescription').optional({ values: 'falsy' }).isString(),
  body('businessEmail').optional({ values: 'falsy' }).isEmail().withMessage('Invalid business email'),
  body('businessPhone').optional({ values: 'falsy' }).isString(),
];

export const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

export const verifyEmailValidation = [
  body('token').trim().notEmpty().withMessage('Token is required').isHexadecimal().isLength({ min: 64, max: 64 })
];

export const forgotPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail()
];

export const resendVerificationValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail()
];

export const resetPasswordValidation = [
  body('token').trim().notEmpty().withMessage('Token is required').isHexadecimal().isLength({ min: 64, max: 64 }),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  })
];
