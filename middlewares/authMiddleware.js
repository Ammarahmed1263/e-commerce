import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401, 'UNAUTHORIZED'));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401, 'UNAUTHORIZED'));
    }

    if (currentUser.accountLockedUntil && currentUser.accountLockedUntil > Date.now()) {
      return next(new AppError('Your account is temporarily locked. Please try again later.', 403, 'ACCOUNT_LOCKED'));
    }

    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated.', 403, 'ACCOUNT_INACTIVE'));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
