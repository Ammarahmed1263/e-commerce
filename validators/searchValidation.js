import { query } from 'express-validator';

export const searchValidation = [
  query('q').optional().trim().isLength({ min: 1 }),
  query('category').optional().isMongoId(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

export const suggestionsValidation = [
  query('q').trim().notEmpty().withMessage('Query is required').isLength({ min: 2 })
];
