import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIFeatures from '../utils/apiFeatures.js';
import { getCache, setCache } from '../services/cacheService.js';
import crypto from 'crypto';

export const search = asyncWrapper(async (req, res, next) => {
  let filter = { status: 'approved', isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
  if (req.query.minRating) filter['rating.average'] = { $gte: Number(req.query.minRating) };

  let query = Product.find(filter);

  if (req.query.q) {
    query = query.find({ $text: { $search: req.query.q } });
  }

  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .priceRange();

  const [products, total] = await Promise.all([
    features.query.lean(),
    Product.countDocuments(features.query.getFilter())
  ]);

  // Aggregations for filters
  const filterAggregations = await Product.aggregate([
    { $match: features.query.getFilter() },
    {
      $facet: {
        categories: [
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryData' } },
          { $unwind: '$categoryData' },
          { $project: { _id: 1, count: 1, name: '$categoryData.name', slug: '$categoryData.slug' } }
        ],
        priceRange: [
          { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } }
        ]
      }
    }
  ]);

  const filters = filterAggregations[0];
  const priceRangeData = filters.priceRange[0] || { minPrice: 0, maxPrice: 0 };

  return success(res, {
    message: 'Search results retrieved',
    data: {
      products,
      filters: {
        categories: filters.categories,
        minPrice: priceRangeData.minPrice,
        maxPrice: priceRangeData.maxPrice
      }
    },
    meta: {
      total,
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 100
    }
  });
});

export const getSuggestions = asyncWrapper(async (req, res, next) => {
  const q = req.query.q;
  const cacheKey = `search:suggestions:${crypto.createHash('md5').update(q).digest('hex')}`;
  
  const cached = await getCache(cacheKey);
  if (cached) {
    return success(res, { message: 'Suggestions retrieved', data: cached });
  }

  const [products, categories] = await Promise.all([
    Product.find({ name: { $regex: q, $options: 'i' }, status: 'approved', isActive: true })
      .limit(5).select('name slug'),
    Category.find({ name: { $regex: q, $options: 'i' }, isActive: true })
      .limit(3).select('name slug')
  ]);

  const suggestions = [
    ...products.map(p => ({ type: 'product', label: p.name, slug: p.slug })),
    ...categories.map(c => ({ type: 'category', label: c.name, slug: c.slug }))
  ];

  await setCache(cacheKey, suggestions, 60); // Cache for 60s

  return success(res, { message: 'Suggestions retrieved', data: suggestions });
});
