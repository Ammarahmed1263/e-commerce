import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import Review from '../models/Review.js';
import AppError from '../utils/appError.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

export const getDashboardStats = asyncWrapper(async (req, res, next) => {
  const [
    totalUsers,
    totalOrders,
    totalRevenueAgg,
    totalVendors,
    recentOrders
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments({ status: { $ne: 'cancelled' } }),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$summary.total' } } }
    ]),
    Vendor.countDocuments({ status: 'approved' }),
    Order.find().sort('-createdAt').limit(5).populate('user', 'firstName lastName email')
  ]);

  const totalRevenue = totalRevenueAgg[0] ? totalRevenueAgg[0].total : 0;

  return success(res, {
    message: 'Admin dashboard stats retrieved',
    data: {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalVendors,
      recentOrders
    }
  });
});

export const moderateReview = asyncWrapper(async (req, res, next) => {
  const { status } = req.body;
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Update product rating if approved
  if (status === 'approved') {
    const stats = await Review.aggregate([
      { $match: { product: review.product, status: 'approved' } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          nRatings: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(review.product, {
        'rating.average': stats[0].avgRating,
        'rating.count': stats[0].nRatings
      });
    }
  }

  return success(res, { message: `Review ${status}`, data: { review } });
});

export const moderateVendor = asyncWrapper(async (req, res, next) => {
  const { status } = req.body;
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (!vendor) {
    return next(new AppError('Vendor not found', 404));
  }

  // Update user role if approved
  if (status === 'approved') {
    await User.findByIdAndUpdate(vendor.user, { role: 'seller' });
  } else if (status === 'suspended' || status === 'rejected') {
    // If suspended, you might want to revert role, but 'seller' can just be restricted by vendor.status
  }

  return success(res, { message: `Vendor ${status}`, data: { vendor } });
});
