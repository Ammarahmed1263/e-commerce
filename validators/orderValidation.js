import { body } from 'express-validator';

export const createOrderValidation = [
  body('shippingAddress.firstName').trim().notEmpty().withMessage('First name is required'),
  body('shippingAddress.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('shippingAddress.phone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('shippingAddress.addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('paymentMethod').isIn(['stripe', 'cash_on_delivery']).withMessage('Invalid payment method'),
  body('paymentIntentId').optional().isString(),

  body('guestEmail')
    .optional()
    .isEmail().withMessage('Valid email is required'),
  body('items')
    .optional()
    .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.product')
    .if(body('items').exists()) 
    .isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity')
    .if(body('items').exists())
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

export const cancelOrderValidation = [
  body('reason').optional().isString().isLength({ max: 500 })
];
