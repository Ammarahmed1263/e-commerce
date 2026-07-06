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
  if (req.query.category) {
    const slugs = req.query.category.split(',');
    const categoryDocs = await Category.find({ slug: { $in: slugs } });
    if (!categoryDocs || categoryDocs.length === 0) {
      return next(new AppError(`Invalid category: ${req.query.category}.`, 400));
    }
    filter.category = { $in: categoryDocs.map(c => c._id) };
    // remove from query to avoid APIFeatures treating it as a plain field
    delete req.query.category;
  }
  
  if (req.query.inStock === 'true') {
    filter.stock = { $gt: 0 };
    delete req.query.inStock;
  }

  if (req.query.minRating) {
    filter['rating.average'] = { $gte: Number(req.query.minRating) };
    delete req.query.minRating;
  }
  if (req.params.categoryId) filter.category = req.params.categoryId;
  if (req.params.vendorId) filter.vendor = req.params.vendorId;

  if (req.query.vendorSlug) {
    const vendor = await Vendor.findOne({ storeSlug: req.query.vendorSlug });
    if (vendor) filter.vendor = vendor._id;
    delete req.query.vendorSlug;
  }

  const features = new APIFeatures(Product.find(filter).populate('category', 'name slug').populate('vendor', 'storeName storeSlug logo'), req.query)
    .textSearch('name', req.query.q)
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

export const getFeaturedProducts = asyncWrapper(async (req, res, next) => {
  const cacheKey = 'products:featured';
  const cached = await getCache(cacheKey);

  if (cached) {
    return success(res, { message: 'Featured products retrieved', data: cached });
  }

  const products = await Product.find({ isFeatured: true, status: 'approved', isActive: true })
    .populate('category', 'name slug')
    .populate('vendor', 'storeName storeSlug logo')
    .sort({ salesCount: -1, 'rating.average': -1 })
    .limit(12);

  await setCache(cacheKey, { products }, 1800); // 30 mins

  return success(res, { message: 'Featured products retrieved', data: { products } });
});

// Vendor Controllers
export const createProduct = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor || vendor.status !== 'approved') {
    return next(new AppError('Only approved vendors can create products', 403));
  }

  const productData = { ...req.body, vendor: vendor._id, status: 'approved' };
  const product = await Product.create(productData);

  await invalidateProducts();

  return created(res, { message: 'Product created successfully', data: { product } });
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

// ── Seller dashboard product management ─────────────────────────────────────
// These endpoints are called from the seller dashboard. They accept categoryName
// (string) and thumbnail (URL string) to keep the UI simple.

export const sellerAddProduct = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const { name, price, stock, categoryName, thumbnail, description } = req.body;

  // Resolve category by name (case-insensitive), or create it if missing
  let category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
  if (!category) {
    category = await Category.create({ name: categoryName });
  }

  const product = await Product.create({
    vendor: vendor._id,
    category: category._id,
    name,
    description: description || name, // fall back to name if no description provided
    price: Number(price),
    stock: Number(stock) || 0,
    thumbnail: thumbnail ? { url: thumbnail } : undefined,
    status: 'approved',
    isActive: true,
  });

  await invalidateProducts();

  // Return shaped to match AdminProduct
  return created(res, {
    message: 'Product created successfully',
    data: {
      product: {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail?.url ?? '',
        category: { id: category._id.toString(), name: category.name },
        vendor: { id: vendor._id.toString(), storeName: vendor.storeName },
        price: product.price,
        stock: product.stock,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        totalSold: 0,
        revenue: 0,
        rating: 0,
        createdAt: product.createdAt,
      }
    }
  });
});

export const sellerUpdateProduct = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const { name, price, stock, categoryName, thumbnail } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.price = Number(price);
  if (stock !== undefined) updateData.stock = Number(stock);
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail ? { url: thumbnail } : undefined;

  if (categoryName) {
    let category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
    if (!category) category = await Category.create({ name: categoryName });
    updateData.category = category._id;
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.productId, vendor: vendor._id },
    updateData,
    { new: true, runValidators: true }
  ).populate('category', 'name');

  if (!product) {
    return next(new AppError('Product not found or you do not have permission', 404));
  }

  await invalidateProducts();
  await invalidateProduct(product.slug);
  await invalidateHomepage();

  return success(res, {
    message: 'Product updated',
    data: {
      product: {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail?.url ?? '',
        category: { id: product.category._id.toString(), name: product.category.name },
        vendor: { id: vendor._id.toString(), storeName: vendor.storeName },
        price: product.price,
        stock: product.stock,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        totalSold: product.salesCount || 0,
        revenue: (product.salesCount || 0) * product.price,
        rating: product.rating?.average || 0,
        createdAt: product.createdAt,
      }
    }
  });
});

export const sellerDeleteProduct = asyncWrapper(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const product = await Product.findOneAndUpdate(
    { _id: req.params.productId, vendor: vendor._id },
    { isActive: false, deletedAt: Date.now() },
    { new: true }
  );

  if (!product) {
    return next(new AppError('Product not found or you do not have permission', 404));
  }

  await invalidateProducts();
  await invalidateProduct(product.slug);
  await invalidateHomepage();

  return success(res, { message: 'Product deleted' });
});
