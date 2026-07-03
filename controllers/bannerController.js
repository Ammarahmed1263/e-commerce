import Banner from '../models/Banner.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

export const getBanners = asyncWrapper(async (req, res, next) => {
  const filter = { isActive: true };
  if (req.query.placement) {
    filter.placement = req.query.placement;
  }

  const banners = await Banner.find(filter).sort('order');

  return success(res, { message: 'Banners retrieved', data: { banners } });
});

export const createBanner = asyncWrapper(async (req, res, next) => {
  const banner = await Banner.create(req.body);
  return created(res, { message: 'Banner created', data: { banner } });
});

export const updateBanner = asyncWrapper(async (req, res, next) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!banner) {
    return next(new AppError('Banner not found', 404));
  }

  return success(res, { message: 'Banner updated', data: { banner } });
});

export const deleteBanner = asyncWrapper(async (req, res, next) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);

  if (!banner) {
    return next(new AppError('Banner not found', 404));
  }

  return success(res, { message: 'Banner deleted' });
});
