import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { success, created } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import * as emailService from '../services/emailService.js';
import APIFeatures from '../utils/apiFeatures.js';

export const createOrder = asyncWrapper(async (req, res, next) => {
  const { shippingAddress, paymentMethod, paymentIntentId, items: guestItems, guestEmail } = req.body;

  let cartItems = [];
  let summary = {};
  let coupon = undefined;
  let userCart = null;

  if (req.user) {
    userCart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    
    if (!userCart || userCart.items.length === 0) {
      return next(new AppError('Your cart is empty', 400));
    }
    
    cartItems = userCart.items;
    summary = userCart.summary;
    coupon = userCart.coupon;
  } else {
    if (!guestItems || guestItems.length === 0) {
      return next(new AppError('Your cart is empty', 400));
    }
    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.phone) {
      return next(new AppError('Shipping details (name and phone) are required for guest checkout', 400));
    }

    let subtotal = 0;
    for (const item of guestItems) {
      const product = await Product.findById(item.product);
      if (!product) return next(new AppError(`Product not found: ${item.product}`, 404));

      cartItems.push({
        product: product, 
        quantity: item.quantity,
        unitPrice: product.price, 
        totalPrice: product.price * item.quantity
      });
      subtotal += (product.price * item.quantity);
    }
    summary = req.body.summary || { subtotal, total: subtotal };
  }

  for (const item of cartItems) {
    if (item.quantity > item.product.stock) {
      return next(new AppError(`Not enough stock for ${item.product.name}`, 400));
    }
  }

  const orderItems = cartItems.map(item => ({
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
    items: orderItems,
    shippingAddress,
    billingAddress: req.body.billingAddress || shippingAddress,
    summary,
    coupon,
    paymentMethod,
    isGuest: !req.user, 
    statusHistory: [{ status: 'placed', note: req.user ? 'Order placed by user' : 'Order placed by guest' }]
  };

  if (req.user) {
    orderData.user = req.user.id;
  }

  if (paymentMethod === 'stripe' && paymentIntentId) {
    orderData.stripePaymentIntentId = paymentIntentId;
    orderData.paymentStatus = 'pending';
  } else if (paymentMethod === 'cash_on_delivery') {
    orderData.paymentStatus = 'pending';
  }

  const order = await Order.create(orderData);

  for (const item of cartItems) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, salesCount: item.quantity }
    });
  }

  if (req.user && userCart) {
    userCart.items = [];
    userCart.coupon = undefined;
    userCart.summary = { subtotal: 0, shipping: 0, tax: 0, discount: 0, couponDiscount: 0, total: 0, itemCount: 0 };
    await userCart.save();
  }

  const emailRecipient = req.user || (guestEmail ? { email: guestEmail, name: shippingAddress.firstName } : null);
  if (emailRecipient) {
    await emailService.sendOrderConfirmationEmail(emailRecipient, order);
  }

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
