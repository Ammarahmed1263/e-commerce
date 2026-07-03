import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Vendor from '../models/Vendor.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIFeatures from '../utils/apiFeatures.js';
import { getCache, setCache, invalidateProducts, invalidateProduct, invalidateHomepage } from '../services/cacheService.js';
import { productsKey, productKey } from '../services/cacheService.js';
import { transformResponse } from '../utils/responseTransformer.js';

export const getProducts = asyncWrapper(async (req, res, next) => {
  const cacheKey = productsKey(req.query);
  const cached = await getCache(cacheKey);

  if (cached) {
    return success(res, { message: 'Products retrieved', data: cached.data, meta: cached.meta });
  }

  let filter = { status: 'approved', isActive: true };
  // Support category filter by slug (e.g., ?category=apparel)
  if (req.query.category) {
    const catSlug = req.query.category;
    const categoryDoc = await Category.findOne({ slug: catSlug });
    if (!categoryDoc) {
      return next(new AppError(`Invalid category: ${catSlug}.`, 400));
    }
    filter.category = categoryDoc._id;
    // remove from query to avoid APIFeatures treating it as a plain field
    delete req.query.category;
  }
  if (req.params.categoryId) filter.category = req.params.categoryId;
  if (req.params.vendorId) filter.vendor = req.params.vendorId;

  if (req.query.vendorSlug) {
    const vendor = await Vendor.findOne({ storeSlug: req.query.vendorSlug });
    if (vendor) filter.vendor = vendor._id;
    delete req.query.vendorSlug;
  }

  const features = new APIFeatures(Product.find(filter).populate('category', 'name slug').populate('vendor', 'storeName storeSlug logo'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .priceRange();

  const products = await features.query;
  const total = await Product.countDocuments(filter);

  const result = {
    data: { products },
    meta: {
      total,
      page: req.query.page * 1 || 1,
      limit: req.query.limit * 1 || 100
    }
  };

  await setCache(cacheKey, result, 1800); // 30 mins
  
  return success(res, { message: 'Products retrieved', ...result });
});

export const getProduct = asyncWrapper(async (req, res, next) => {
  const cacheKey = productKey(req.params.slug);
  const cached = await getCache(cacheKey);

  if (cached) {
    return success(res, { message: 'Product retrieved', data: cached });
  }

  const product = await Product.findOne({ slug: req.params.slug, status: 'approved', isActive: true })
    .populate('category', 'name slug')
    .populate('vendor', 'storeName storeSlug logo');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  await setCache(cacheKey, { product }, 1800);

  return success(res, { message: 'Product retrieved', data: { product } });
});

// Vendor Controllers
export const createProduct = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor || vendor.status !== 'approved') {
    return next(new AppError('Only approved vendors can create products', 403));
  }

  const productData = { ...req.body, vendor: vendor._id, status: 'pending' };
  const product = await Product.create(productData);

  await invalidateProducts();

  return created(res, { message: 'Product created and pending approval', data: { product } });
});

export const updateProduct = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug, vendor: vendor._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    return next(new AppError('Product not found or you do not have permission', 404));
  }

  await invalidateProducts();
  await invalidateProduct(req.params.slug);
  await invalidateHomepage();

  return success(res, { message: 'Product updated', data: { product } });
});

export const deleteProduct = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug, vendor: vendor._id },
    { isActive: false, deletedAt: Date.now() },
    { new: true }
  );

  if (!product) {
    return next(new AppError('Product not found or you do not have permission', 404));
  }

  await invalidateProducts();
  await invalidateProduct(req.params.slug);
  await invalidateHomepage();

  return success(res, { message: 'Product deleted' });
});
