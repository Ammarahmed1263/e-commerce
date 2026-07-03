const asyncWrapper = (asyncFn) => (req, res, next) => {
  Promise.resolve(asyncFn(req, res, next)).catch(next);
};

export default asyncWrapper;
