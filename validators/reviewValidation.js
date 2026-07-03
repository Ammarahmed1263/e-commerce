import { body } from 'express-validator';

export const createReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 100 }),
  body('body').trim().notEmpty().withMessage('Review body is required').isLength({ min: 10, max: 2000 })
];

export const updateReviewValidation = [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().trim().isLength({ max: 100 }),
  body('body').optional().trim().isLength({ max: 2000 })
];
