import { body } from 'express-validator';

export const createStripeIntentValidation = [
  body('cartId').isMongoId().withMessage('Valid cart ID is required'),
  body('currency').optional().isIn(['usd', 'eur', 'gbp', 'egp']).withMessage('Unsupported currency')
];

export const refundValidation = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('reason').optional().isString().isLength({ max: 500 })
];
