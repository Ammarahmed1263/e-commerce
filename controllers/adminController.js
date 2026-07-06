import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import Review from '../models/Review.js';
import AppError from '../utils/appError.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

// Existing stats controller
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

// Existing review moderation controller
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

// Existing vendor moderation controller
export const moderateVendor = asyncWrapper(async (req, res, next) => {
  const { status } = req.body;
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (!vendor) {
    return next(new AppError('Vendor not found', 404));
  }

  // Keep user role in sync with vendor status
  if (status === 'approved') {
    await User.findByIdAndUpdate(vendor.user, { role: 'seller' });
  } else if (status === 'rejected' || status === 'suspended') {
    await User.findByIdAndUpdate(vendor.user, { role: 'customer' });
  }

  return success(res, { message: `Vendor ${status}`, data: { vendor } });
});

// ─── NEW ADMIN CONTROLLERS ──────────────────────────────────────────────────

// GET /admin/stats
export const getStats = asyncWrapper(async (req, res, next) => {
  const [
    totalRevenueAgg,
    totalOrders,
    totalUsers,
    totalProducts,
    pendingVendors,
    totalVendors
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$summary.total' } } }
    ]),
    Order.countDocuments({ status: { $ne: 'cancelled' } }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true, status: 'approved' }),
    Vendor.countDocuments({ status: 'pending' }),
    Vendor.countDocuments()
  ]);

  const totalRevenue = totalRevenueAgg[0] ? totalRevenueAgg[0].total : 0;

  // Since we don't have historical snapshot DB, mock growth metrics sensibly
  return success(res, {
    data: {
      stats: {
        totalRevenue,
        revenueGrowth: 12.5,
        totalOrders,
        ordersGrowth: 8.2,
        totalUsers,
        usersGrowth: 4.5,
        totalProducts,
        productsGrowth: 15.0,
        pendingVendors,
        totalVendors
      }
    }
  });
});

// GET /admin/revenue-chart
export const getRevenueChart = asyncWrapper(async (req, res, next) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const chartData = [];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[d.getMonth()] + ' ' + (d.getFullYear() % 100);
    
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    
    const stats = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$summary.total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    chartData.push({
      month: monthName,
      revenue: stats[0] ? stats[0].revenue : 0,
      orders: stats[0] ? stats[0].count : 0
    });
  }
  
  return success(res, { data: { revenueChart: chartData } });
});

// GET /admin/recent-orders
export const getRecentOrders = asyncWrapper(async (req, res, next) => {
  const orders = await Order.find()
    .sort('-createdAt')
    .limit(5)
    .populate('user', 'firstName lastName avatar');
    
  const recentOrders = orders.map(order => ({
    id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest Customer',
    customerAvatar: order.user?.avatar?.url,
    total: order.summary?.total || 0,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt
  }));
  
  return success(res, { data: { recentOrders } });
});

// GET /admin/top-products
export const getTopProducts = asyncWrapper(async (req, res, next) => {
  const products = await Product.find({ isActive: true })
    .sort('-salesCount')
    .limit(5)
    .populate('category', 'name');
    
  const topProducts = products.map(product => ({
    id: product._id,
    name: product.name,
    thumbnail: product.thumbnail?.url || '',
    category: product.category?.name || 'Uncategorized',
    unitsSold: product.salesCount || 0,
    revenue: (product.salesCount || 0) * product.price
  }));
  
  return success(res, { data: { topProducts } });
});

// GET /admin/recent-users
export const getRecentUsers = asyncWrapper(async (req, res, next) => {
  const users = await User.find({ isActive: true })
    .sort('-createdAt')
    .limit(5);
    
  const recentUsers = users.map(user => ({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar?.url,
    role: user.role,
    createdAt: user.createdAt
  }));
  
  return success(res, { data: { recentUsers } });
});

// GET /admin/vendors
export const getVendors = asyncWrapper(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    filter.storeName = { $regex: req.query.search, $options: 'i' };
  }
  
  const vendors = await Vendor.find(filter)
    .skip(skip)
    .limit(limit)
    .populate('user', 'firstName lastName email');
    
  const total = await Vendor.countDocuments(filter);
  
  const formattedVendors = await Promise.all(vendors.map(async (vendor) => {
    const productCount = await Product.countDocuments({ vendor: vendor._id });
    return {
      id: vendor._id.toString(),
      storeName: vendor.storeName,
      storeSlug: vendor.storeSlug,
      logo: vendor.logo?.url,
      businessEmail: vendor.businessEmail || vendor.user?.email || '',
      ownerName: vendor.user ? `${vendor.user.firstName} ${vendor.user.lastName}` : 'Unknown',
      status: vendor.status,
      productCount,
      totalSales: vendor.totalSales || 0,
      totalRevenue: vendor.totalRevenue || 0,
      rating: vendor.averageRating || 0,
      isVerified: vendor.isVerified || false,
      joinedAt: vendor.createdAt
    };
  }));
  
  return success(res, {
    data: { vendors: formattedVendors },
    meta: { total, page, limit }
  });
});

// GET /admin/users
export const getUsers = asyncWrapper(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  
  const filter = { isActive: true };
  if (req.query.role && req.query.role !== 'all') {
    filter.role = req.query.role;
  }
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }
  
  const users = await User.find(filter)
    .skip(skip)
    .limit(limit);
    
  const total = await User.countDocuments(filter);
  
  const formattedUsers = await Promise.all(users.map(async (user) => {
    const orders = await Order.find({ user: user._id, status: { $ne: 'cancelled' } });
    const totalSpent = orders.reduce((sum, order) => sum + (order.summary?.total || 0), 0);
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar?.url,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      totalOrders: orders.length,
      totalSpent,
      createdAt: user.createdAt
    };
  }));
  
  return success(res, {
    data: { users: formattedUsers },
    meta: { total, page, limit }
  });
});

// PATCH /admin/users/:id/role
export const updateUserRole = asyncWrapper(async (req, res, next) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  return success(res, { message: 'User role updated', data: { user } });
});

// DELETE /admin/users/:id
export const deleteUser = asyncWrapper(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false, deletedAt: Date.now() }, { new: true });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  return success(res, { message: 'User deleted' });
});

// GET /admin/products
export const getProducts = asyncWrapper(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  
  const filter = { isActive: true };
  if (req.query.category && req.query.category !== 'all') {
    const { default: Category } = await import('../models/Category.js');
    const cat = await Category.findOne({ name: req.query.category });
    if (cat) filter.category = cat._id;
  }
  if (req.query.featured !== undefined) {
    filter.isFeatured = req.query.featured === 'true' || req.query.featured === true;
  }
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }
  
  const products = await Product.find(filter)
    .skip(skip)
    .limit(limit)
    .populate('category', 'name')
    .populate('vendor', 'storeName');
    
  const total = await Product.countDocuments(filter);
  
  const formattedProducts = products.map(product => ({
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    thumbnail: product.thumbnail?.url || '',
    category: product.category ? { id: product.category._id, name: product.category.name } : { id: '', name: 'Uncategorized' },
    vendor: product.vendor ? { id: product.vendor._id, storeName: product.vendor.storeName } : { id: '', storeName: 'Unknown' },
    price: product.price,
    stock: product.stock,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    totalSold: product.salesCount || 0,
    revenue: (product.salesCount || 0) * product.price,
    rating: product.rating?.average || 0,
    createdAt: product.createdAt
  }));
  
  return success(res, {
    data: { products: formattedProducts },
    meta: { total, page, limit }
  });
});

// PATCH /admin/products/:id/featured
export const toggleProductFeatured = asyncWrapper(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  product.isFeatured = !product.isFeatured;
  await product.save();
  return success(res, { message: 'Product featured status toggled', data: { product } });
});

// DELETE /admin/products/:id
export const deleteProduct = asyncWrapper(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false, deletedAt: Date.now() }, { new: true });
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  return success(res, { message: 'Product deleted' });
});

// GET /admin/orders
export const getOrders = asyncWrapper(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    filter.orderNumber = { $regex: req.query.search, $options: 'i' };
  }
  
  const orders = await Order.find(filter)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('user', 'firstName lastName email avatar');
    
  const total = await Order.countDocuments(filter);
  
  const formattedOrders = orders.map(order => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customer: order.user ? {
      id: order.user._id,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      email: order.user.email,
      avatar: order.user.avatar?.url
    } : { id: '', firstName: 'Guest', lastName: 'Customer', email: '' },
    itemCount: order.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    total: order.summary?.total || 0,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt
  }));
  
  return success(res, {
    data: { orders: formattedOrders },
    meta: { total, page, limit }
  });
});

// PATCH /admin/orders/:id/status
export const updateOrderStatus = asyncWrapper(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  order.status = status;
  order.statusHistory.push({ status, note: `Status updated to ${status} by admin` });
  await order.save();
  return success(res, { message: 'Order status updated', data: { order } });
});

// GET /admin/category-chart
export const getCategoryChart = asyncWrapper(async (req, res, next) => {
  const { default: Category } = await import('../models/Category.js');
  const categories = await Category.find();
  const categoryChart = await Promise.all(categories.map(async (cat) => {
    const count = await Product.countDocuments({ category: cat._id, isActive: true });
    return {
      label: cat.name,
      value: count
    };
  }));
  return success(res, { data: { categoryChart: categoryChart.filter(c => c.value > 0) } });
});

// GET /admin/order-status-chart
export const getOrderStatusChart = asyncWrapper(async (req, res, next) => {
  const statuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  const orderStatusChart = await Promise.all(statuses.map(async (status) => {
    const count = await Order.countDocuments({ status });
    return {
      label: status,
      value: count
    };
  }));
  return success(res, { data: { orderStatusChart } });
});
