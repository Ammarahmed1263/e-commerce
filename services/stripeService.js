import stripe from '../config/stripe.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import * as emailService from './emailService.js';

export const createOrGetCustomer = async (user) => {
  if (!user) return null;

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
      isGuest: user ? 'false' : 'true',
      userId: user ? user._id.toString() : '',
      cartId: cart._id ? cart._id.toString() : '',
      guestEmail: customerEmail || '',
      guestItems: user ? '' : JSON.stringify(cart.items.map(i => ({ p: i.product._id.toString(), q: i.quantity })))
    },
  };

  if (user) {
    sessionConfig.customer = await createOrGetCustomer(user);
  } else if (customerEmail) {
    sessionConfig.customer_email = customerEmail;
  }

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
  const { isGuest, userId, cartId, guestEmail, guestItems } = session.metadata;

  const shippingAddress = {
    firstName: session.shipping_details?.name?.split(' ')[0] || '',
    lastName: session.shipping_details?.name?.split(' ').slice(1).join(' ') || '',
    phone: session.customer_details?.phone || '',
    addressLine1: session.shipping_details?.address?.line1 || '',
    city: session.shipping_details?.address?.city || '',
    postalCode: session.shipping_details?.address?.postal_code || '',
    country: session.shipping_details?.address?.country || ''
  };

  const existingOrder = await Order.findOne({ stripePaymentIntentId: session.payment_intent });
  if (existingOrder) {
    console.log(`Order already exists for payment intent ${session.payment_intent}`);
    return;
  }

  let cartItems = [];
  let summary = {};
  let orderUser = null;
  let dbCart = null;
  let coupon = undefined;

  if (isGuest === 'false') {
    dbCart = await Cart.findById(cartId).populate('items.product');
    if (!dbCart || dbCart.items.length === 0) return console.error('Cart not found during webhook processing');

    orderUser = await User.findById(userId);
    if (!orderUser) return console.error('User not found during webhook processing');

    cartItems = dbCart.items;
    summary = dbCart.summary;
    coupon = dbCart.coupon;
  } 
  else {
    const parsedItems = JSON.parse(guestItems);
    let subtotal = 0;

    for (const item of parsedItems) {
      const product = await Product.findById(item.p);
      if (product) {
        cartItems.push({
          product: product,
          quantity: item.q,
          unitPrice: product.price,
          totalPrice: product.price * item.q
        });
        subtotal += (product.price * item.q);
      }
    }
    summary = { subtotal, total: subtotal }; 
  }

  const orderItems = cartItems.map(item => ({
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

  const orderData = {
    orderNumber,
    items: orderItems,
    shippingAddress,
    billingAddress: shippingAddress,
    summary,
    coupon,
    summary: cart.summary,
    coupon: cart.coupon,
    pointsUsed: cart.pointsUsed,
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    stripePaymentIntentId: session.payment_intent,
    isGuest: isGuest === 'true',
    statusHistory: [{ status: 'placed', note: 'Order created via Stripe Checkout webhook' }]
  };

  if (isGuest === 'false') {
    orderData.user = userId;
  }

  const order = await Order.create(orderData);

  for (const item of cartItems) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, salesCount: item.quantity }
    });
  }

  if (isGuest === 'false' && dbCart) {
    dbCart.items = [];
    dbCart.coupon = undefined;
    dbCart.summary = { subtotal: 0, shipping: 0, tax: 0, discount: 0, couponDiscount: 0, total: 0, itemCount: 0 };
    await dbCart.save();
  }

  const emailRecipient = orderUser || { email: guestEmail, name: shippingAddress.firstName };
  await emailService.sendOrderConfirmationEmail(emailRecipient, order);
  
  console.log(`Successfully created order ${orderNumber}`);
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
