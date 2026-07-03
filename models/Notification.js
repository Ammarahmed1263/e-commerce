import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'payment_success',
        'payment_failed',
        'review_approved',
        'vendor_approved',
        'new_product',
        'promotion'
      ]
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
