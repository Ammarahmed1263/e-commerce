import Coupon from '../models/Coupon.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIFeatures from '../utils/apiFeatures.js';

export const createCoupon = asyncWrapper(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);
  return created(res, { message: 'Coupon created', data: { coupon } });
});

export const getCoupons = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(Coupon.find(), req.query)
    .filter()
    .sort()
    .paginate();

  const coupons = await features.query;
  const total = await Coupon.countDocuments();

  return success(res, { message: 'Coupons retrieved', data: { coupons }, meta: { total } });
});

export const updateCoupon = asyncWrapper(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  return success(res, { message: 'Coupon updated', data: { coupon } });
});

export const deleteCoupon = asyncWrapper(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  return success(res, { message: 'Coupon deleted' });
});
