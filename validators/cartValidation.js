import { body } from 'express-validator';

export const addItemValidation = [
  body('productId').exists().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

export const updateItemValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

export const couponValidation = [
  body('code').trim().isString().isLength({ min: 3, max: 20 }).withMessage('Invalid coupon code')
];

export const mergeCartValidation = [
  body('guestCartId').isUUID().withMessage('Invalid guest cart ID')
];
