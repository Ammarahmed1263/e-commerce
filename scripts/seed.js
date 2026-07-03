import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import { userRoles } from '../utils/userRoles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding');

    await User.deleteMany();
    await Category.deleteMany();
    await Vendor.deleteMany();
    await Product.deleteMany();

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@luxora.com',
      password: 'Password123!',
      role: userRoles.ADMIN,
      isEmailVerified: true
    });

    console.log('Admin user created: admin@luxora.com / Password123!');

    const category = await Category.create({
      name: 'Electronics',
      isActive: true,
      isFeatured: true
    });

    console.log('Sample category created');

    console.log('Data destroyed and seeded successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  seedData().then(() => console.log('Destroyed data'));
} else {
  seedData();
}
