import mongoose from 'mongoose';
import { generateSlug } from '../utils/generateSlug.js';

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    thumbnail: {
      url: String,
      publicId: String
    },
    images: [
      {
        url: String,
        publicId: String,
        alt: String,
        order: Number
      }
    ],
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'pending'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    rating: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    salesCount: {
      type: Number,
      default: 0
    },
    deletedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }
});

productSchema.index({ category: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
