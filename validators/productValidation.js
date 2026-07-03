import { body } from 'express-validator';

export const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ min: 3, max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isMongoId().withMessage('Invalid category ID'),
  body('stock').optional({ values: 'falsy' }).isInt({ min: 0 }),
  body('isFeatured').optional({ values: 'falsy' }).isBoolean()
];

export const updateProductValidation = [
  body('name').optional({ values: 'falsy' }).trim().isLength({ min: 3, max: 200 }),
  body('description').optional({ values: 'falsy' }).trim(),
  body('price').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('category').optional({ values: 'falsy' }).isMongoId(),
  body('stock').optional({ values: 'falsy' }).isInt({ min: 0 }),
  body('isFeatured').optional({ values: 'falsy' }).isBoolean(),
  body('status').optional({ values: 'falsy' }).isIn(['draft', 'pending', 'approved', 'rejected'])
];
