import { body } from 'express-validator';

export const createCategoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ min: 2, max: 50 }),
  body('parent').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid parent category ID'),
  body('isFeatured').optional({ values: 'falsy' }).isBoolean()
];

export const updateCategoryValidation = [
  body('name').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 50 }),
  body('parent').optional({ values: 'falsy' }).isMongoId(),
  body('isFeatured').optional({ values: 'falsy' }).isBoolean(),
  body('isActive').optional({ values: 'falsy' }).isBoolean()
];
