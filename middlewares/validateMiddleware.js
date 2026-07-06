import { validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

const validate = (validations) => {
  return async (req, res, next) => {
    // Run ALL validators so the response contains every field error at once
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const fieldErrorsObject = {};
    errors.array().forEach((err) => {
      fieldErrorsObject[err.path] = err.msg;
    });

    return next(new AppError('Validation failed', 422, 'VALIDATION_ERROR', fieldErrorsObject));
  };
};

export default validate;
