export const success = (res, { message, data = null, meta = null, statusCode = 200 }) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });
};

export const created = (res, { message, data = null }) => {
  return success(res, { message, data, statusCode: 201 });
};

export const noContent = (res) => {
  return res.status(204).send();
};

export const error = (res, { message, errors = null, code = 'ERROR', statusCode = 500 }) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    code,
    statusCode
  });
};
