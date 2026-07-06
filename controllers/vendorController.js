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

  // Elevate role to 'seller' immediately so the user can access the seller
  // dashboard right away. The vendor.status ('pending' → 'approved') handles
  // the product-creation gate separately.
  await User.findByIdAndUpdate(req.user.id, { role: 'seller' });

  return created(res, { message: 'Vendor registration submitted and pending approval', data: { vendor } });
});

export const getVendorDashboard = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });

  if (!vendor) {
    return next(new AppError('Vendor profile not found', 404));
  }

  return success(res, { message: 'Vendor dashboard retrieved', data: { vendor } });
});

export const getVendorStats = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const { default: Product } = await import('../models/Product.js');
  const { default: Order } = await import('../models/Order.js');

  const totalProducts = await Product.countDocuments({ vendor: vendor._id, isActive: true, status: 'approved' });

  // Sum revenue and units sold from all delivered/processing/shipped orders for this vendor
  const revenueAgg = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.vendor': vendor._id, status: { $in: ['placed', 'processing', 'shipped', 'delivered'] } } },
    { $group: { _id: null, totalRevenue: { $sum: '$items.totalPrice' }, totalSold: { $sum: '$items.quantity' } } }
  ]);

  const { totalRevenue = 0, totalSold = 0 } = revenueAgg[0] || {};

  return success(res, {
    message: 'Seller stats retrieved',
    data: {
      stats: {
        totalRevenue,
        totalSold,
        totalProducts,
        rating: vendor.averageRating || 0
      }
    }
  });
});

export const getVendorRevenueChart = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const { default: Order } = await import('../models/Order.js');

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const revenueAgg = await Order.aggregate([
    { $unwind: '$items' },
    {
      $match: {
        'items.vendor': vendor._id,
        status: { $in: ['placed', 'processing', 'shipped', 'delivered'] },
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, orderId: '$_id' },
        revenue: { $sum: '$items.totalPrice' }
      }
    },
    {
      $group: {
        _id: { year: '$_id.year', month: '$_id.month' },
        revenue: { $sum: '$revenue' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const revenueChart = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const found = revenueAgg.find(r => r._id.year === year && r._id.month === month);
    revenueChart.push({
      month: MONTH_NAMES[month - 1],
      revenue: found ? found.revenue : 0,
      orders: found ? found.orders : 0
    });
  }

  return success(res, { message: 'Revenue chart retrieved', data: { revenueChart } });
});

export const getVendorProducts = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const { default: Product } = await import('../models/Product.js');
  const { default: APIFeatures } = await import('../utils/apiFeatures.js');

  const features = new APIFeatures(
    Product.find({ vendor: vendor._id, isActive: true }).populate('category', 'name slug'),
    req.query
  ).sort().paginate();

  const rawProducts = await features.query;
  const total = await Product.countDocuments({ vendor: vendor._id, isActive: true });

  // Shape to match AdminProduct interface
  const products = rawProducts.map(p => ({
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    thumbnail: p.thumbnail?.url || (p.images?.[0]?.url ?? ''),
    category: p.category ? { id: p.category._id.toString(), name: p.category.name } : null,
    vendor: { id: vendor._id.toString(), storeName: vendor.storeName },
    price: p.price,
    stock: p.stock,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    totalSold: p.salesCount || 0,
    revenue: (p.salesCount || 0) * p.price,
    rating: p.rating?.average || 0,
    createdAt: p.createdAt
  }));

  return success(res, {
    message: 'Seller products retrieved',
    data: { products },
    meta: { total, page: req.query.page * 1 || 1, limit: req.query.limit * 1 || 20 }
  });
});

export const getVendorOrders = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const { default: Order } = await import('../models/Order.js');

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 20;
  const skip = (page - 1) * limit;

  const filter = { 'items.vendor': vendor._id };
  if (req.query.status) filter.status = req.query.status;

  const rawOrders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'firstName lastName email avatar');

  const total = await Order.countDocuments(filter);

  // Shape to match AdminOrder interface
  const orders = rawOrders.map(o => ({
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    customer: o.user ? {
      id: o.user._id.toString(),
      firstName: o.user.firstName,
      lastName: o.user.lastName,
      email: o.user.email,
      avatar: o.user.avatar?.url || null
    } : null,
    itemCount: o.items.filter(i => i.vendor?.toString() === vendor._id.toString()).length,
    total: o.items
      .filter(i => i.vendor?.toString() === vendor._id.toString())
      .reduce((sum, i) => sum + (i.totalPrice || 0), 0),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt
  }));

  return success(res, {
    message: 'Seller orders retrieved',
    data: { orders },
    meta: { total, page, limit }
  });
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
