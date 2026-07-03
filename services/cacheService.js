import crypto from 'crypto';
import { get, set, del, delPattern } from '../utils/redisCache.js';

const hashQuery = (query) => {
  return crypto.createHash('sha256').update(JSON.stringify(query || {})).digest('hex');
};

export const homepageKey = () => 'homepage:data';
export const categoriesKey = (query) => `categories:${hashQuery(query)}`;
export const categoryKey = (slug) => `category:${slug}`;
export const productsKey = (query) => `products:${hashQuery(query)}`;
export const productKey = (slug) => `product:${slug}`;
export const featuredProductsKey = () => 'products:featured';
export const vendorKey = (slug) => `vendor:${slug}`;

export const invalidateProducts = async () => await delPattern('products:*');
export const invalidateProduct = async (slug) => await del(productKey(slug));
export const invalidateCategories = async () => await delPattern('categories:*');
export const invalidateCategory = async (slug) => await del(categoryKey(slug));
export const invalidateHomepage = async () => await del(homepageKey());
export const invalidateVendor = async (slug) => await del(vendorKey(slug));

export const getCache = async (key) => await get(key);
export const setCache = async (key, value, ttl = 3600) => await set(key, value, ttl);
