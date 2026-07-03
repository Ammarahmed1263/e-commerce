import { body } from 'express-validator';

export const updateProfileValidation = [
  body('firstName').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 50 }),
  body('phone').optional({ values: 'falsy' }).isMobilePhone('any'),
  body('address.addressLine1').optional({ values: 'falsy' }).isString(),
  body('address.city').optional({ values: 'falsy' }).isString(),
  body('address.state').optional({ values: 'falsy' }).isString(),
  body('address.postalCode').optional({ values: 'falsy' }).isString(),
  body('address.country').optional({ values: 'falsy' }).isString()
];
