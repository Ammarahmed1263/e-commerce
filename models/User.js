import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { userRoles } from '../utils/userRoles.js';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    phone: {
      type: String,
      unique: true
    },
    isPhoneVerified: { 
    type: Boolean, 
    default: false 
  },
    avatar: {
      url: String,
      publicId: String
    },
    role: {
      type: String,
      enum: Object.values(userRoles),
      default: userRoles.CUSTOMER
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    accountLockedUntil: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    rewardPoints: {
      type: Number,
      default: 0
    },
    deletedAt: {
      type: Date
    },
    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    stripeCustomerId: {
      type: String,
      select: false
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ passwordResetToken: 1 });
userSchema.index({ emailVerificationToken: 1 });

const User = mongoose.model('User', userSchema);
export default User;
