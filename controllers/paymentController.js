import * as stripeService from '../services/stripeService.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import AppError from '../utils/appError.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

export const createStripeIntent = asyncWrapper(async (req, res, next) => {
  const { cartId, currency = 'usd' } = req.body;

  const cart = await Cart.findById(cartId);
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Cart is empty or not found', 400));
  }

  // Ensure cart belongs to user or is guest cart
  if (cart.user && cart.user.toString() !== req.user.id) {
    return next(new AppError('Unauthorized', 403));
  }

  const customerId = await stripeService.createOrGetCustomer(req.user);
  
  const amountInCents = Math.round(cart.summary.total * 100);

  const paymentIntent = await stripeService.createPaymentIntent(amountInCents, currency, {
    cartId: cart._id.toString(),
    userId: req.user.id
  });

  return success(res, {
    message: 'Payment intent created',
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    }
  });
});

export const handleStripeWebhook = asyncWrapper(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await stripeService.handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await stripeService.handlePaymentIntentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

export const initiateRefund = asyncWrapper(async (req, res, next) => {
  const { orderId, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.paymentMethod !== 'stripe' || !order.stripePaymentIntentId) {
    return next(new AppError('Order cannot be refunded via Stripe', 400));
  }

  const refund = await stripeService.initiateRefund(order.stripePaymentIntentId, reason);

  order.paymentStatus = 'refunded';
  order.status = 'refunded';
  order.statusHistory.push({ status: 'refunded', note: `Refunded via Stripe. Reason: ${reason || 'Customer request'}` });
  await order.save();

  return success(res, {
    message: 'Refund initiated successfully',
    data: {
      refundId: refund.id,
      status: refund.status
    }
  });
});
