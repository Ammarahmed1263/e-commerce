import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    guestId: {
      type: String,
      sparse: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        unitPrice: {
          type: Number,
          required: true
        },
        totalPrice: {
          type: Number,
          required: true
        }
      }
    ],
    summary: {
      subtotal: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      itemCount: { type: Number, default: 0 },
      pointsDiscount: { type: Number, default: 0 }
    },
    coupon: {
      code: String,
      discount: Number,
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
      }
    },
    expiresAt: {
      type: Date
    },
    pointsUsed: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
