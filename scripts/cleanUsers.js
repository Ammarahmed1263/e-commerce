import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import RefreshToken from '../models/RefreshToken.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB for database cleanup...');

    // Delete user-related collections
    const userResult = await User.deleteMany();
    const vendorResult = await Vendor.deleteMany();
    const cartResult = await Cart.deleteMany();
    const orderResult = await Order.deleteMany();
    const reviewResult = await Review.deleteMany();
    const notificationResult = await Notification.deleteMany();
    const tokenResult = await RefreshToken.deleteMany();

    console.log('\n🧹 Database Cleaned Successfully:');
    console.log(`- Deleted ${userResult.deletedCount} User(s)`);
    console.log(`- Deleted ${vendorResult.deletedCount} Vendor(s)`);
    console.log(`- Deleted ${cartResult.deletedCount} Cart(s)`);
    console.log(`- Deleted ${orderResult.deletedCount} Order(s)`);
    console.log(`- Deleted ${reviewResult.deletedCount} Review(s)`);
    console.log(`- Deleted ${notificationResult.deletedCount} Notification(s)`);
    console.log(`- Deleted ${tokenResult.deletedCount} Session Token(s)`);

    console.log('\n✨ Database is now clear of all user accounts and transactional data.');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Cleanup failed: ${error.message}`);
    process.exit(1);
  }
};

cleanDatabase();
