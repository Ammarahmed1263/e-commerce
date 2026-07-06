import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIFeatures from '../utils/apiFeatures.js';
import { getCache, setCache, invalidateCategories, invalidateCategory, invalidateHomepage } from '../services/cacheService.js';
import { categoriesKey, categoryKey } from '../services/cacheService.js';

export const getCategories = asyncWrapper(async (req, res, next) => {
  const cacheKey = categoriesKey(req.query);
  const cached = await getCache(cacheKey);
  
  if (cached) {
    return success(res, { message: 'Categories retrieved', data: cached.data, meta: cached.meta });
  }

  const features = new APIFeatures(Category.find({ isActive: true }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const categories = await features.query;
  const total = await Category.countDocuments({ isActive: true });

  const categoriesWithCounts = await Promise.all(categories.map(async (cat) => {
    const productCount = await Product.countDocuments({ category: cat._id, isActive: true, status: 'approved' });
    return { ...cat.toObject(), productCount };
  }));

  const result = {
    data: { categories: categoriesWithCounts },
    meta: {
      total,
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 100
    }
  };

  await setCache(cacheKey, result, 3600); // 1 hour cache
  
  return success(res, { message: 'Categories retrieved', ...result });
});

export const getCategory = asyncWrapper(async (req, res, next) => {
  const cacheKey = categoryKey(req.params.slug);
  const cached = await getCache(cacheKey);

  if (cached) {
    return success(res, { message: 'Category retrieved', data: cached });
  }

  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const productCount = await Product.countDocuments({ category: category._id, isActive: true, status: 'approved' });
  const categoryWithCount = { ...category.toObject(), productCount };

  await setCache(cacheKey, { category: categoryWithCount }, 3600);
  
  return success(res, { message: 'Category retrieved', data: { category: categoryWithCount } });
});

// Admin Controllers

export const createCategory = asyncWrapper(async (req, res, next) => {
  const category = await Category.create(req.body);
  
  await invalidateCategories();
  await invalidateHomepage();
  
  return created(res, { message: 'Category created', data: { category } });
});

export const updateCategory = asyncWrapper(async (req, res, next) => {
  const category = await Category.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true, runValidators: true }
  );

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  await invalidateCategories();
  await invalidateCategory(req.params.slug);
  await invalidateHomepage();

  return success(res, { message: 'Category updated', data: { category } });
});

export const deleteCategory = asyncWrapper(async (req, res, next) => {
  const category = await Category.findOneAndUpdate(
    { slug: req.params.slug },
    { isActive: false },
    { new: true }
  );

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  await invalidateCategories();
  await invalidateCategory(req.params.slug);
  await invalidateHomepage();

  return success(res, { message: 'Category deleted' });
});
