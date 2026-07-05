import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true
    },
    isGuest: {
      type: Boolean,
      default: false
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Vendor'
        },
        name: String,
        thumbnail: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number
      }
    ],
    shippingAddress: {
      firstName: String,
      lastName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    billingAddress: {
      firstName: String,
      lastName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    summary: {
      subtotal: Number,
      shipping: Number,
      tax: Number,
      discount: Number,
      couponDiscount: Number,
      total: Number,
      currency: { type: String, default: 'USD' }
    },
    coupon: {
      code: String,
      discount: Number
    },
    status: {
      type: String,
      enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'placed'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'cash_on_delivery']
    },
    paymentTransactionId: String,
    stripePaymentIntentId: String,
    trackingNumber: String,
    carrier: String,
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
      }
    ],
    notes: String,
    cancelReason: String
  },
  {
    timestamps: true
  }
);

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
