import Newsletter from '../models/Newsletter.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';

export const subscribe = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide an email to subscribe.', 400));
  }

  const existing = await Newsletter.findOne({ email });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save();
      return success(res, { message: 'Successfully resubscribed to the newsletter!' });
    }
    return next(new AppError('This email is already subscribed.', 400));
  }

  await Newsletter.create({ email });
  return created(res, { message: 'Successfully subscribed to the newsletter!' });
});

export const unsubscribe = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide an email to unsubscribe.', 400));
  }

  const existing = await Newsletter.findOne({ email });
  if (!existing || !existing.isActive) {
    return next(new AppError('This email is not subscribed.', 400));
  }

  existing.isActive = false;
  await existing.save();
  return success(res, { message: 'Successfully unsubscribed from the newsletter.' });
});

export const getSubscribers = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(Newsletter.find(), req.query)
    .filter()
    .sort()
    .paginate();

  const subscribers = await features.query;
  const total = await Newsletter.countDocuments();

  return success(res, { message: 'Subscribers retrieved', data: { subscribers }, meta: { total } });
});
