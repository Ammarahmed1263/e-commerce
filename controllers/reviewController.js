import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIFeatures from '../utils/apiFeatures.js';

export const getProductReviews = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;

  const features = new APIFeatures(Review.find({ product: productId, status: 'approved' }).populate('user', 'firstName avatar'), req.query)
    .sort()
    .paginate();

  const reviews = await features.query;
  const total = await Review.countDocuments({ product: productId, status: 'approved' });

  // Aggregation for summary
  const summary = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDist: { $push: '$rating' }
      }
    }
  ]);

  let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (summary.length > 0) {
    summary[0].ratingDist.forEach(r => { distribution[r]++; });
  }

  return success(res, {
    message: 'Reviews retrieved',
    data: {
      reviews,
      summary: summary.length > 0 ? {
        averageRating: summary[0].averageRating,
        totalReviews: summary[0].totalReviews,
        distribution
      } : { averageRating: 0, totalReviews: 0, distribution }
    },
    meta: { total, page: req.query.page * 1 || 1, limit: req.query.limit * 1 || 100 }
  });
});

export const createReview = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;

  // Check if user purchased product
  const order = await Order.findOne({
    user: req.user.id,
    status: 'delivered',
    'items.product': productId
  });

  if (!order) {
    return next(new AppError('You can only review purchased and delivered products', 403));
  }

  // Check for existing review
  const existingReview = await Review.findOne({ product: productId, user: req.user.id });
  if (existingReview) {
    return next(new AppError('You have already reviewed this product', 409));
  }

  const images = req.files ? req.files.map(f => ({ url: f.path, publicId: f.filename })) : [];

  const review = await Review.create({
    product: productId,
    user: req.user.id,
    order: order._id,
    rating: req.body.rating,
    title: req.body.title,
    body: req.body.body,
    images,
    status: 'pending' // Admin approval required
  });

  await Product.findByIdAndUpdate(productId, { $inc: { 'rating.count': 1 } });

  return created(res, { message: 'Review submitted and pending approval', data: { review } });
});

export const updateReview = asyncWrapper(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.reviewId, user: req.user.id });

  if (!review) {
    return next(new AppError('Review not found or unauthorized', 404));
  }

  if (req.body.rating) review.rating = req.body.rating;
  if (req.body.title) review.title = req.body.title;
  if (req.body.body) review.body = req.body.body;
  review.status = 'pending'; // Re-moderate

  await review.save();

  return success(res, { message: 'Review updated and pending approval', data: { review } });
});

export const deleteReview = asyncWrapper(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.reviewId });

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  await Review.findByIdAndDelete(review._id);

  // Recalculate product rating
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
  } else {
    await Product.findByIdAndUpdate(review.product, {
      'rating.average': 0,
      'rating.count': 0
    });
  }

  return success(res, { message: 'Review deleted' });
});
