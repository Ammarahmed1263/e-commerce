import stripe from '../config/stripe.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

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
