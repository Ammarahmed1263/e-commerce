import { validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

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
