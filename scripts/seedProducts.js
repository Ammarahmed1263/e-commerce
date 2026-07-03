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

const seedProducts = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB for product seeding...');

    // Clear existing products, categories, and vendors
    console.log('🧹 Clearing existing product catalog, categories, and vendor accounts...');
    await Product.deleteMany();
    await Category.deleteMany();
    await Vendor.deleteMany();
    
    // Also remove the old seller if exists to avoid conflicts
    await User.deleteMany({ email: 'seller@luxora.com' });

    console.log('👤 Creating Seller account...');
    const seller = await User.create({
      firstName: 'Sarah',
      lastName: 'Seller',
      email: 'seller@luxora.com',
      password: 'Password123!',
      role: userRoles.SELLER,
      isEmailVerified: true
    });

    console.log('🏬 Creating Vendor store ("Lumina Lounge")...');
    const vendor = await Vendor.create({
      user: seller._id,
      storeName: 'Lumina Lounge',
      storeDescription: 'Your premium lounge for curated electronics, apparel, and lifestyle accessories.',
      businessEmail: 'lounge@luxora.com',
      businessPhone: '+1234567890',
      status: 'approved',
      isVerified: true
    });

    console.log('🗂️ Creating categories...');
    const categories = await Promise.all([
      Category.create({
        name: 'Electronics',
        isActive: true,
        isFeatured: true,
        image: {
          url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
          publicId: 'cat_electronics'
        }
      }),
      Category.create({
        name: 'Apparel',
        isActive: true,
        isFeatured: true,
        image: {
          url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
          publicId: 'cat_apparel'
        }
      }),
      Category.create({
        name: 'Home Living',
        isActive: true,
        isFeatured: true,
        image: {
          url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=800&q=80',
          publicId: 'cat_home_living'
        }
      })
    ]);

    const findCategory = (name) => categories.find(c => c.name === name)._id;

    console.log('📦 Seeding products...');
    const productsData = [
      // Electronics
      {
        vendor: vendor._id,
        category: findCategory('Electronics'),
        name: 'AeroTune Wireless Headphones',
        description: 'High-fidelity wireless headphones with hybrid active noise cancellation, ambient sound pass-through, and up to 40 hours of continuous playback.',
        price: 129.99,
        stock: 45,
        isFeatured: true,
        status: 'approved',
        isActive: true,
        thumbnail: {
          url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          publicId: 'seed_headphones'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          alt: 'AeroTune Wireless Headphones',
          order: 0
        }]
      },
      {
        vendor: vendor._id,
        category: findCategory('Electronics'),
        name: 'KeyClick Mechanical Keyboard',
        rating: { average: 4.8, count: 124 },
        description: 'Premium tenkeyless mechanical keyboard featuring hot-swappable linear yellow switches, customizable RGB backlighting, and solid aluminum casing.',
        price: 89.99,
        stock: 30,
        isFeatured: false,
        status: 'approved',
        isActive: true,
        thumbnail: {
          url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          publicId: 'seed_keyboard'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          alt: 'KeyClick Mechanical Keyboard',
          order: 0
        }]
      },
      // Apparel
      {
        vendor: vendor._id,
        category: findCategory('Apparel'),
        name: 'Minimalist Leather Backpack',
        description: 'Handcrafted full-grain leather backpack designed for modern professionals. Fits up to a 15-inch laptop and features hidden anti-theft compartments.',
        price: 199.99,
        stock: 15,
        isFeatured: true,
        status: 'approved',
        isActive: true,
        thumbnail: {
          url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
          publicId: 'seed_backpack'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
          alt: 'Minimalist Leather Backpack',
          order: 0
        }]
      },
      {
        vendor: vendor._id,
        category: findCategory('Apparel'),
        name: 'Urban Classic Sneakers',
        description: 'Ultra-lightweight and breathable everyday sneakers made from 100% recycled canvas and fitted with responsive memory-foam insoles.',
        price: 79.99,
        stock: 50,
        isFeatured: false,
        status: 'approved',
        isActive: true,
        thumbnail: {
          url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
          publicId: 'seed_sneakers'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
          alt: 'Urban Classic Sneakers',
          order: 0
        }]
      },
      // Home Living
      {
        vendor: vendor._id,
        category: findCategory('Home Living'),
        name: 'AromaZen Scented Candle',
        description: 'Eco-friendly organic soy wax candle hand-poured in a reusable amber glass jar. Fragrance profile: soothing French Lavender and Eucalyptus.',
        price: 24.99,
        stock: 120,
        isFeatured: false,
        status: 'approved',
        isActive: true,
        thumbnail: {
          url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
          publicId: 'seed_candle'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
          alt: 'AromaZen Scented Candle',
          order: 0
        }]
      },
      {
        vendor: vendor._id,
        category: findCategory('Home Living'),
        name: 'Ceramic Craft Coffee Mug',
        description: 'Individually molded ceramic coffee mug finished in a clean matte glaze. Ergonomically shaped handle, dishwasher, and microwave safe.',
        price: 18.99,
        stock: 80,
        isFeatured: true,
        status: 'approved',
        isActive: true,
        thumbnail: {
          url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
          publicId: 'seed_mug'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
          alt: 'Ceramic Craft Coffee Mug',
          order: 0
        }]
      }
    ];

    await Promise.all(productsData.map(product => Product.create(product)));

    console.log('\n✨ Database Seed Completed Successfully:');
    console.log(`- Created 1 Seller account: seller@luxora.com / Password123!`);
    console.log(`- Created 1 Vendor store: "Lumina Lounge"`);
    console.log(`- Created ${categories.length} Categories (Electronics, Apparel, Home Living)`);
    console.log(`- Created ${productsData.length} Products with images, pricing, and stock`);

    console.log('\n🚀 Your e-commerce store is fully populated and ready for action!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedProducts();
