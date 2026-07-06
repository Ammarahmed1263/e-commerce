import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import * as emailService from '../services/emailService.js';
import APIFeatures from '../utils/apiFeatures.js';

export const createOrder = asyncWrapper(async (req, res, next) => {
  const { shippingAddress, paymentMethod, paymentIntentId } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty', 400));
  }

  // Check stock again
  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      return next(new AppError(`Not enough stock for ${item.product.name}`, 400));
    }
  }

  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    vendor: item.product.vendor,
    name: item.product.name,
    thumbnail: item.product.thumbnail?.url,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice
  }));

  let orderNumber;
  let isUnique = false;
  while (!isUnique) {
    orderNumber = generateOrderNumber();
    const existing = await Order.findOne({ orderNumber });
    if (!existing) isUnique = true;
  }

  const orderData = {
    orderNumber,
    user: req.user.id,
    items: orderItems,
    shippingAddress,
    billingAddress: req.body.billingAddress || shippingAddress,
    summary: cart.summary,
    coupon: cart.coupon,
    pointsUsed: cart.pointsUsed,
    paymentMethod,
    statusHistory: [{ status: 'placed', note: 'Order placed by user' }]
  };

  if (paymentMethod === 'stripe' && paymentIntentId) {
    orderData.stripePaymentIntentId = paymentIntentId;
    orderData.paymentStatus = 'pending'; // webhook will update this to 'paid'
  } else if (paymentMethod === 'cash_on_delivery') {
    orderData.paymentStatus = 'pending';
  }

  const order = await Order.create(orderData);

  // Deduct stock and increment sales
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, salesCount: item.quantity }
    });
  }

  // Clear cart
  cart.items = [];
  cart.coupon = undefined;
  cart.pointsUsed = 0;
  cart.summary = { subtotal: 0, shipping: 0, tax: 0, discount: 0, couponDiscount: 0, pointsDiscount: 0, total: 0, itemCount: 0 };
  await cart.save();

  // Add reward points and deduct used points
  const earnedPoints = Math.floor(order.summary.total);
  const usedPoints = order.pointsUsed || 0;
  const netPoints = earnedPoints - usedPoints;
  await User.findByIdAndUpdate(req.user.id, { $inc: { rewardPoints: netPoints } });

  await emailService.sendOrderConfirmationEmail(req.user, order);

  return created(res, { message: 'Order created successfully', data: { order } });
});

export const getOrders = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(Order.find({ user: req.user.id }), req.query)
    .filter()
    .sort()
    .paginate();

  const orders = await features.query;
  const total = await Order.countDocuments({ user: req.user.id });

  return success(res, {
    message: 'Orders retrieved',
    data: { orders },
    meta: { total, page: req.query.page * 1 || 1, limit: req.query.limit * 1 || 100 }
  });
});

export const getOrder = asyncWrapper(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  return success(res, { message: 'Order retrieved', data: { order } });
});

export const cancelOrder = asyncWrapper(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (!['placed', 'processing'].includes(order.status)) {
    return next(new AppError(`Order cannot be cancelled because its status is ${order.status}`, 400));
  }

  order.status = 'cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by user';
  order.statusHistory.push({ status: 'cancelled', note: order.cancelReason });
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, salesCount: -item.quantity }
    });
  }

  return success(res, { message: 'Order cancelled successfully', data: { order } });
});
