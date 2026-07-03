import { body } from 'express-validator';

export const registerVendorValidation = [
  body('storeName').trim().notEmpty().withMessage('Store name is required').isLength({ min: 2, max: 100 }),
  body('storeDescription').optional({ values: 'falsy' }).trim().isString(),
  body('businessEmail').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('businessPhone').optional({ values: 'falsy' }).isMobilePhone('any')
];

export const updateVendorValidation = [
  body('storeName').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 100 }),
  body('storeDescription').optional({ values: 'falsy' }).trim().isString(),
  body('businessEmail').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('businessPhone').optional({ values: 'falsy' }).isMobilePhone('any')
];
