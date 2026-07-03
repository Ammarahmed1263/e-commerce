import { error } from './apiResponse.js';

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return { message, code: 'INVALID_ID', statusCode: 400 };
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'value';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return { message, code: 'DUPLICATE_FIELD', statusCode: 409 };
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return { message, code: 'VALIDATION_ERROR', statusCode: 422, errors };
};

const handleJWTError = () => {
  return { message: 'Invalid token. Please log in again!', code: 'INVALID_TOKEN', statusCode: 401 };
};

const handleJWTExpiredError = () => {
  return { message: 'Your token has expired! Please log in again.', code: 'TOKEN_EXPIRED', statusCode: 401 };
};

const errorHandler = (err, req, res, next) => {
  let handledError = { ...err, message: err.message, name: err.name, errmsg: err.errmsg };

  let errorData = {
    statusCode: err.statusCode || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Something went very wrong!',
    errors: err.data || null
  };

  if (handledError.name === 'CastError') {
    const handled = handleCastErrorDB(handledError);
    Object.assign(errorData, handled);
  }
  if (handledError.code === 11000) {
    const handled = handleDuplicateFieldsDB(handledError);
    Object.assign(errorData, handled);
  }
  if (handledError.name === 'ValidationError') {
    const handled = handleValidationErrorDB(handledError);
    Object.assign(errorData, handled);
  }
  if (handledError.name === 'JsonWebTokenError') {
    const handled = handleJWTError();
    Object.assign(errorData, handled);
  }
  if (handledError.name === 'TokenExpiredError') {
    const handled = handleJWTExpiredError();
    Object.assign(errorData, handled);
  }

  if (err.isOperational) {
    errorData.message = err.message;
    errorData.statusCode = err.statusCode;
    errorData.code = err.code;
    errorData.errors = err.data;
  } else if (!handledError.name && !err.statusCode) {
    errorData.message = 'Something went very wrong!';
    errorData.statusCode = 500;
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(errorData.statusCode).json({
      success: false,
      code: errorData.code,
      message: errorData.message,
      errors: errorData.errors,
      stack: err.stack,
      error: err
    });
  }

  return error(res, {
    message: errorData.message,
    code: errorData.code,
    statusCode: errorData.statusCode,
    errors: errorData.errors
  });
};

export default errorHandler;
