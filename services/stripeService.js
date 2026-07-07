import stripe from '../config/stripe.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import * as emailService from './emailService.js';

export const createOrGetCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId: user._id.toString() }
  });

  user.stripeCustomerId = customer.id;
  await user.save({ validateBeforeSave: false });

  return customer.id;
};

export const createCheckoutSession = async (cart, user) => {
  const lineItems = cart.items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.product.name,
        description: item.product.description ? item.product.description.substring(0, 100) : '',
        images: item.product.thumbnail?.url ? [item.product.thumbnail.url] : [],
      },
      unit_amount: Math.round(item.unitPrice * 100),
    },
    quantity: item.quantity,
  }));

  if (cart.summary?.tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Tax',
          description: 'Calculated tax',
        },
        unit_amount: Math.round(cart.summary.tax * 100),
      },
      quantity: 1,
    });
  }

  if (cart.summary?.shipping > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping',
          description: 'Shipping and handling',
        },
        unit_amount: Math.round(cart.summary.shipping * 100),
      },
      quantity: 1,
    });
  }

  const sessionConfig = {
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    customer: await createOrGetCustomer(user),
    success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cart`,
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AE', 'SA', 'EG'],
    },
    metadata: {
      userId: user._id.toString(),
      cartId: cart._id.toString(),
    },
  };

  if (cart.coupon && cart.coupon.discount) {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: Math.round(cart.coupon.discount * 100),
      currency: 'usd',
      duration: 'once',
      name: cart.coupon.code,
    });
    sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return session;
};

export const handleCheckoutSessionCompleted = async (session) => {
  const { userId, cartId } = session.metadata;

  const shippingAddress = {
    firstName: session.shipping_details?.name?.split(' ')[0] || '',
    lastName: session.shipping_details?.name?.split(' ').slice(1).join(' ') || '',
    phone: session.customer_details?.phone || '',
    addressLine1: session.shipping_details?.address?.line1 || '',
    city: session.shipping_details?.address?.city || '',
    postalCode: session.shipping_details?.address?.postal_code || '',
    country: session.shipping_details?.address?.country || ''
  };

  // Check if order already exists for this stripe session
  const existingOrder = await Order.findOne({ stripePaymentIntentId: session.payment_intent });
  if (existingOrder) {
    console.log(`Order already exists for payment intent ${session.payment_intent}`);
    return;
  }

  const cart = await Cart.findById(cartId).populate('items.product');
  if (!cart || cart.items.length === 0) {
    console.error(`Cart ${cartId} is empty or not found during webhook processing`);
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error(`User ${userId} not found during webhook processing`);
    return;
  }

  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    vendor: item.product.vendor,
    name: item.product.name,
    thumbnail: item.product.thumbnail?.url || item.product.images?.[0]?.url,
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

  const order = await Order.create({
    orderNumber,
    user: userId,
    items: orderItems,
    shippingAddress,
    billingAddress: shippingAddress,
    summary: cart.summary,
    coupon: cart.coupon,
    pointsUsed: cart.pointsUsed,
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    stripePaymentIntentId: session.payment_intent,
    statusHistory: [{ status: 'placed', note: 'Order created via Stripe Checkout webhook' }]
  });

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
  await User.findByIdAndUpdate(userId, { $inc: { rewardPoints: netPoints } });

  await emailService.sendOrderConfirmationEmail(user, order);
  console.log(`Successfully created order ${orderNumber} for user ${userId}`);
};

export const createPaymentIntent = async (amountInCents, currency, metadata) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    }
  });

  return paymentIntent;
};

export const constructWebhookEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

export const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  const order = await Order.findById(orderId);
  if (order) {
    order.paymentStatus = 'paid';
    order.statusHistory.push({
      status: 'payment_success',
      note: 'Payment successfully processed via Stripe'
    });
    await order.save();
  }
};

export const handlePaymentIntentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  const order = await Order.findById(orderId);
  if (order) {
    order.paymentStatus = 'failed';
    order.statusHistory.push({
      status: 'payment_failed',
      note: 'Payment failed via Stripe'
    });
    await order.save();
  }
};

export const initiateRefund = async (paymentIntentId, reason) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: reason || 'requested_by_customer'
  });
  return refund;
};
