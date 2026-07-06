import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import AppError from '../utils/appError.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

// Helper: get or create the wishlist for the current user
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }
  return wishlist;
};

// GET /wishlist
// Returns { wishlist: { items, itemCount } }
export const getWishlist = asyncWrapper(async (req, res, next) => {
  const wishlist = await getOrCreateWishlist(req.user.id);

  await wishlist.populate({
    path: 'items.product',
    select: 'name slug price thumbnail stock status isActive rating'
  });

  // Filter out any items whose product has since been deactivated
  const activeItems = wishlist.items.filter(
    (item) => item.product && item.product.isActive && item.product.status === 'approved'
  );

  // Normalise to the shape the frontend WishlistItem type expects
  const items = activeItems.map((item) => ({
    id: item.product._id.toString(),
    product: {
      id: item.product._id.toString(),
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      thumbnail: item.product.thumbnail?.url ?? '',
      stock: item.product.stock,
      rating: item.product.rating
    },
    addedAt: item.addedAt
  }));

  return success(res, {
    message: 'Wishlist retrieved',
    data: {
      wishlist: {
        items,
        itemCount: items.length
      }
    }
  });
});

// POST /wishlist/items
// Body: { productId }
// Returns { itemCount }
export const addItem = asyncWrapper(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError('productId is required', 400));
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    status: 'approved'
  });

  if (!product) {
    return next(new AppError('Product not found or unavailable', 404));
  }

  const wishlist = await getOrCreateWishlist(req.user.id);

  const alreadyAdded = wishlist.items.some(
    (item) => item.product.toString() === productId
  );

  if (!alreadyAdded) {
    wishlist.items.push({ product: productId, addedAt: new Date() });
    await wishlist.save();
  }

  return success(res, {
    message: alreadyAdded ? 'Product already in wishlist' : 'Product added to wishlist',
    data: { itemCount: wishlist.items.length }
  });
});

// DELETE /wishlist/items/:productId
// Returns { itemCount }
export const removeItem = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await getOrCreateWishlist(req.user.id);

  const originalLength = wishlist.items.length;
  wishlist.items = wishlist.items.filter(
    (item) => item.product.toString() !== productId
  );

  if (wishlist.items.length === originalLength) {
    return next(new AppError('Product not found in wishlist', 404));
  }

  await wishlist.save();

  return success(res, {
    message: 'Product removed from wishlist',
    data: { itemCount: wishlist.items.length }
  });
});

// POST /wishlist/items/:productId/move-to-cart
// Body: { quantity } (optional, defaults to 1)
// Returns { cartItemCount }
export const moveToCart = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;
  const quantity = req.body.quantity || 1;

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    status: 'approved'
  });

  if (!product) {
    return next(new AppError('Product not found or unavailable', 404));
  }

  if (product.stock < quantity) {
    return next(new AppError('Not enough stock available', 400));
  }

  // Add to cart (upsert the item)
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id });
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingIndex > -1) {
    const newQty = cart.items[existingIndex].quantity + quantity;
    if (newQty > product.stock) {
      return next(new AppError('Not enough stock available', 400));
    }
    cart.items[existingIndex].quantity = newQty;
    cart.items[existingIndex].totalPrice = newQty * cart.items[existingIndex].unitPrice;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      unitPrice: product.price,
      totalPrice: quantity * product.price
    });
  }

  // Recalculate cart summary
  let subtotal = 0;
  let itemCount = 0;
  cart.items.forEach((item) => {
    subtotal += item.totalPrice;
    itemCount += item.quantity;
  });
  cart.summary.subtotal = subtotal;
  cart.summary.itemCount = itemCount;
  cart.summary.tax = parseFloat((subtotal * 0.08).toFixed(2));
  cart.summary.shipping = subtotal > 100 ? 0 : 10;
  cart.summary.total = parseFloat((subtotal + cart.summary.tax + cart.summary.shipping).toFixed(2));

  await cart.save();

  // Remove from wishlist
  const wishlist = await getOrCreateWishlist(req.user.id);
  wishlist.items = wishlist.items.filter(
    (item) => item.product.toString() !== productId
  );
  await wishlist.save();

  return success(res, {
    message: 'Product moved to cart',
    data: { cartItemCount: cart.summary.itemCount }
  });
});
