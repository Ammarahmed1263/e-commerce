import { body } from 'express-validator';

export const createCheckoutSessionValidation = [
  body('cartId').isMongoId().withMessage('Valid cart ID is required'),
  body('shippingAddress').optional().isObject().withMessage('Shipping address must be an object')
];

export const refundValidation = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('reason').optional().isString().isLength({ max: 500 })
];
