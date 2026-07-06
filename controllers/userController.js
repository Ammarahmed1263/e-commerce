import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import { deleteCloudinaryImage } from '../services/uploadService.js';
import { changePasswordValidation } from '../validators/authValidation.js';

export const getMe = asyncWrapper(async (req, res, next) => {
  // req.user is already populated by authMiddleware
  const user = await User.findById(req.user.id);
  return success(res, {
    message: 'User profile retrieved',
    data: { user }
  });
});

export const updateProfile = asyncWrapper(async (req, res, next) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'address'];
  const updateData = {};

  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true
  });

  return success(res, {
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});

export const updateAvatar = asyncWrapper(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  const user = await User.findById(req.user.id);

  if (user.avatar && user.avatar.publicId) {
    await deleteCloudinaryImage(user.avatar.publicId);
  }

  user.avatar = {
    url: req.file.path,
    publicId: req.file.filename
  };

  await user.save({ validateBeforeSave: false });

  return success(res, {
    message: 'Avatar updated successfully',
    data: { avatar: user.avatar }
  });
});

export const changePassword = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD'));
  }

  user.password = req.body.newPassword;
  await user.save();

  return success(res, { message: 'Password changed successfully' });
});

export const deleteAccount = asyncWrapper(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false, deletedAt: Date.now() });
  
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  return success(res, { message: 'Account deleted successfully' });
});

export const getMyReviews = asyncWrapper(async (req, res, next) => {
  const { default: Review } = await import('../models/Review.js');
  const { default: APIFeatures } = await import('../utils/apiFeatures.js');

  const features = new APIFeatures(Review.find({ user: req.user.id }).populate('product', 'name slug thumbnail'), req.query)
    .sort()
    .paginate();

  const reviews = await features.query;
  const total = await Review.countDocuments({ user: req.user.id });

  return success(res, {
    message: 'My reviews retrieved',
    data: { reviews },
    meta: { total, page: req.query.page * 1 || 1, limit: req.query.limit * 1 || 100 }
  });
});

export const getMyOrders = asyncWrapper(async (req, res, next) => {
  const { default: Order } = await import('../models/Order.js');
  const { default: APIFeatures } = await import('../utils/apiFeatures.js');

  const baseQuery = Order.find({ user: req.user.id })
    .populate('items.product', 'name slug thumbnail price');

  const features = new APIFeatures(baseQuery, req.query)
    .filter()
    .sort()
    .paginate();

  const orders = await features.query;
  const total = await Order.countDocuments({ user: req.user.id });

  return success(res, {
    message: 'My orders retrieved',
    data: { orders },
    meta: { total, page: req.query.page * 1 || 1, limit: req.query.limit * 1 || 10 }
  });
});
