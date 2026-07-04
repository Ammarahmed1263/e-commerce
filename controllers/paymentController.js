import * as stripeService from '../services/stripeService.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import AppError from '../utils/appError.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

export const createCheckoutSession = asyncWrapper(async (req, res, next) => {
  const { cartId } = req.body;

  const cart = await Cart.findById(cartId).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Cart is empty or not found', 400));
  }

  if (cart.user && cart.user.toString() !== req.user.id) {
    return next(new AppError('Unauthorized', 403));
  }

  const session = await stripeService.createCheckoutSession(cart, req.user);

  return success(res, {
    message: 'Checkout session created',
    data: {
      id: session.id,
      url: session.url
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
    case 'checkout.session.completed':
      await stripeService.handleCheckoutSessionCompleted(event.data.object);
      break;
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
