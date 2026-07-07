import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import AppError from '../utils/appError.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import crypto from 'crypto';

const resolveCart = async (req) => {
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id });
  } else {
    let guestId = req.cookies.guestCartId;
    if (!guestId) {
      guestId = crypto.randomUUID();
      cart = await Cart.create({ guestId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
      req.res.cookie('guestCartId', guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    } else {
      cart = await Cart.findOne({ guestId });
      if (!cart) cart = await Cart.create({ guestId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    }
  }
  return cart;
};

const recalculateSummary = (cart) => {
  let subtotal = 0;
  let itemCount = 0;

  cart.items.forEach(item => {
    subtotal += item.totalPrice;
    itemCount += item.quantity;
  });

  cart.summary.subtotal = subtotal;
  cart.summary.itemCount = itemCount;

  let couponDiscount = 0;
  if (cart.coupon && cart.coupon.discount) {
    couponDiscount = cart.coupon.discount; // Fixed discount or apply percentage
  }
  cart.summary.couponDiscount = couponDiscount;
  
  let pointsDiscount = 0;
  if (cart.pointsUsed > 0) {
    pointsDiscount = cart.pointsUsed * 0.01; // 100 points = $1
  }
  cart.summary.pointsDiscount = pointsDiscount;
  
  const totalDiscount = couponDiscount + pointsDiscount;

  // Tax 8%
  cart.summary.tax = parseFloat(((subtotal - totalDiscount) * 0.08).toFixed(2));
  if (cart.summary.tax < 0) cart.summary.tax = 0;
  
  // Free shipping above $100
  cart.summary.shipping = (subtotal - totalDiscount) > 100 ? 0 : 10;
  
  cart.summary.total = parseFloat(((subtotal - totalDiscount) + cart.summary.tax + cart.summary.shipping).toFixed(2));
  
  if (cart.summary.total < 0) cart.summary.total = 0;
};

export const getCart = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  await cart.populate({
    path: 'items.product',
    select: 'name slug thumbnail price stock status isActive'
  });

  return success(res, { message: 'Cart retrieved', data: { cart } });
});

export const addItem = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  const { productId, quantity } = req.body;

  // Accept either a Mongo ObjectId or a slug/custom identifier
  let product;
  try {
    product = await Product.findOne({
      $or: [{ _id: productId }, { slug: productId }]
    });
  } catch (err) {
    // If Mongoose throws a CastError for an invalid ObjectId, treat as not found
    if (err.name === 'CastError') {
      return next(new AppError('Invalid product ID format', 400));
    }
    throw err;
  }
  if (!product || !product.isActive || product.status !== 'approved') {
    return next(new AppError('Product not found or unavailable', 404));
  }

  if (product.stock < quantity) {
    return next(new AppError('Not enough stock available', 400));
  }

  const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + quantity;
    if (newQty > product.stock) {
      return next(new AppError('Not enough stock available', 400));
    }
    cart.items[existingItemIndex].quantity = newQty;
    cart.items[existingItemIndex].totalPrice = newQty * product.price;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      unitPrice: product.price,
      totalPrice: quantity * product.price
    });
  }

  recalculateSummary(cart);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Item added to cart', data: { cart } });
});

export const updateItem = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  const { itemId } = req.params;
  const { quantity } = req.body;

  const item = cart.items.id(itemId);
  if (!item) {
    return next(new AppError('Item not found in cart', 404));
  }

  const product = await Product.findById(item.product);
  if (!product) {
    cart.items.pull(itemId);
  } else {
    if (quantity === 0) {
      cart.items.pull(itemId);
    } else {
      if (quantity > product.stock) {
        return next(new AppError('Not enough stock available', 400));
      }
      item.quantity = quantity;
      item.totalPrice = quantity * item.unitPrice;
    }
  }

  recalculateSummary(cart);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Cart updated', data: { cart } });
});

export const removeItem = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  const { itemId } = req.params;

  cart.items.pull(itemId);
  recalculateSummary(cart);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Item removed from cart', data: { cart } });
});

export const clearCart = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  
  cart.items = [];
  cart.coupon = undefined;
  recalculateSummary(cart);
  await cart.save();

  return success(res, { message: 'Cart cleared' });
});

export const mergeCart = asyncWrapper(async (req, res, next) => {
  const { guestCartId } = req.body;
  if (!req.user) {
    return next(new AppError('You must be logged in to merge carts', 401));
  }

  const guestCart = await Cart.findOne({ guestId: guestCartId });
  if (!guestCart) {
    return next(new AppError('Guest cart not found', 404));
  }

  const userCart = await Cart.findOne({ user: req.user.id }) || await Cart.create({ user: req.user.id });

  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(item => item.product.toString() === guestItem.product.toString());
    
    if (existingItem) {
      existingItem.quantity += guestItem.quantity;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      userCart.items.push(guestItem);
    }
  }

  recalculateSummary(userCart);
  await userCart.save();
  await Cart.findByIdAndDelete(guestCart._id);

  res.clearCookie('guestCartId');

  await userCart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Carts merged', data: { cart: userCart } });
});

export const applyCoupon = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  const coupon = await Coupon.findOne({ 
    code: req.body.code.toUpperCase(),
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null },
      { expiresAt: { $exists: false } }
    ]
  });

  if (!coupon) {
    return next(new AppError('Invalid or expired coupon', 400));
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return next(new AppError('Coupon usage limit reached', 400));
  }

  if (cart.summary.subtotal < coupon.minimumPurchase) {
    return next(new AppError(`Minimum purchase amount of $${coupon.minimumPurchase} required`, 400));
  }

  if (req.user) {
    const userUsage = coupon.usedBy.filter(userId => userId.toString() === req.user.id).length;
    if (userUsage >= coupon.perUserLimit) {
      return next(new AppError('You have reached the usage limit for this coupon', 400));
    }
  }

  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (cart.summary.subtotal * coupon.value) / 100;
    if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
      discountAmount = coupon.maximumDiscount;
    }
  } else {
    discountAmount = coupon.value;
  }

  cart.coupon = {
    code: coupon.code,
    discount: discountAmount,
    couponId: coupon._id
  };

  recalculateSummary(cart);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Coupon applied', data: { cart } });
});

export const removeCoupon = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  cart.coupon = undefined;
  recalculateSummary(cart);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Coupon removed', data: { cart } });
});

export const applyPoints = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  if (!req.user) {
    return next(new AppError('You must be logged in to use reward points', 401));
  }

  const { points } = req.body;
  
  if (!points || points <= 0) {
    return next(new AppError('Please specify a valid number of points to use', 400));
  }

  const { default: User } = await import('../models/User.js');
  const user = await User.findById(req.user.id);
  
  if (points > (user.rewardPoints || 0)) {
    return next(new AppError(`You only have ${user.rewardPoints || 0} points available`, 400));
  }

  cart.pointsUsed = points;
  recalculateSummary(cart);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Points applied to cart', data: { cart } });
});

export const removePoints = asyncWrapper(async (req, res, next) => {
  const cart = await resolveCart(req);
  
  cart.pointsUsed = 0;
  recalculateSummary(cart);
  await cart.save();
  await cart.populate('items.product', 'name slug thumbnail price stock');

  return success(res, { message: 'Points removed from cart', data: { cart } });
});
