import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIFeatures from '../utils/apiFeatures.js';
import { getCache, setCache, invalidateVendor, vendorKey } from '../services/cacheService.js';

export const getVendors = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(Vendor.find({ status: 'approved' }), req.query)
    .filter()
    .sort()
    .paginate();

  const vendors = await features.query;
  const total = await Vendor.countDocuments({ status: 'approved' });

  return success(res, { message: 'Vendors retrieved', data: { vendors }, meta: { total } });
});

export const getVendor = asyncWrapper(async (req, res, next) => {
  const cacheKey = vendorKey(req.params.slug);
  const cached = await getCache(cacheKey);

  if (cached) {
    return success(res, { message: 'Vendor retrieved', data: cached });
  }

  const vendor = await Vendor.findOne({ storeSlug: req.params.slug, status: 'approved' });

  if (!vendor) {
    return next(new AppError('Vendor not found', 404));
  }

  await setCache(cacheKey, { vendor }, 3600);

  return success(res, { message: 'Vendor retrieved', data: { vendor } });
});

export const registerVendor = asyncWrapper(async (req, res, next) => {
  const existingVendor = await Vendor.findOne({ user: req.user.id });
  if (existingVendor) {
    return next(new AppError('You have already applied to become a vendor', 400));
  }

  const vendor = await Vendor.create({
    user: req.user.id,
    storeName: req.body.storeName,
    storeDescription: req.body.storeDescription,
    businessEmail: req.body.businessEmail,
    businessPhone: req.body.businessPhone,
    status: 'pending'
  });

  return created(res, { message: 'Vendor registration submitted and pending approval', data: { vendor } });
});

export const getVendorDashboard = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });

  if (!vendor) {
    return next(new AppError('Vendor profile not found', 404));
  }

  return success(res, { message: 'Vendor dashboard retrieved', data: { vendor } });
});

export const updateVendorProfile = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!vendor) {
    return next(new AppError('Vendor profile not found', 404));
  }

  await invalidateVendor(vendor.storeSlug);

  return success(res, { message: 'Vendor profile updated', data: { vendor } });
});
