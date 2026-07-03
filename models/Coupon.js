import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      required: true
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    minimumPurchase: {
      type: Number,
      default: 0
    },
    maximumDiscount: {
      type: Number
    },
    usageLimit: {
      type: Number
    },
    usageCount: {
      type: Number,
      default: 0
    },
    perUserLimit: {
      type: Number,
      default: 1
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    expiresAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

couponSchema.index({ isActive: 1 });
couponSchema.index({ expiresAt: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
