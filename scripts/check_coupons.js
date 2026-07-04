import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../models/Coupon.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    let coupons = await Coupon.find();
    
    if (coupons.length === 0) {
      const newCoupon = await Coupon.create({
        code: "WELCOME10",
        type: "percentage",
        value: 10,
        minimumPurchase: 10,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      });
      console.log("CREATED_COUPON: WELCOME10");
    } else {
      console.log("EXISTING_COUPONS:", coupons.map(c => c.code).join(', '));
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

run();
