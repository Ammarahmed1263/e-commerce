import { body } from 'express-validator';

export const reviewModerationValidation = [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
];

export const vendorModerationValidation = [
  body('status').isIn(['approved', 'rejected', 'suspended']).withMessage('Status must be approved, rejected, or suspended')
];
