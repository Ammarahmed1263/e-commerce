import mongoose from 'mongoose';
import { generateSlug } from '../utils/generateSlug.js';

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    },
    storeSlug: {
      type: String,
      unique: true,
      lowercase: true
    },
    storeDescription: String,
    businessEmail: String,
    businessPhone: String,
    logo: {
      url: String,
      publicId: String
    },
    banner: {
      url: String,
      publicId: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    averageRating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

vendorSchema.pre('save', function () {
  if (this.isModified('storeName')) {
    this.storeSlug = generateSlug(this.storeName);
  }
});

vendorSchema.index({ status: 1 });

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
