import mongoose from 'mongoose';
import { generateSlug } from '../utils/generateSlug.js';

const categorySchema = new mongoose.Schema(
  {
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
    image: {
      url: String,
      publicId: String
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    isFeatured: {
      type: Boolean,
      default: false
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

categorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }
});

categorySchema.index({ parent: 1 });
categorySchema.index({ isFeatured: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
