import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    subtitle: String,
    placement: {
      type: String,
      enum: ['hero', 'promotional', 'announcement'],
      required: true
    },
    image: {
      desktop: {
        url: String,
        publicId: String
      },
      mobile: {
        url: String,
        publicId: String
      }
    },
    cta: {
      label: String,
      url: String
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: Date,
    endDate: Date
  },
  {
    timestamps: true
  }
);

bannerSchema.index({ placement: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ order: 1 });

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
