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

// ─── Product Data ─────────────────────────────────────────────────────────────
const CATEGORIES_DATA = [
  { name: 'Electronics',       isFeatured: true,  image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800' },
  { name: 'Fashion & Apparel', isFeatured: true,  image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800' },
  { name: 'Home & Living',     isFeatured: true,  image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800' },
  { name: 'Sports & Outdoors', isFeatured: true,  image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800' },
  { name: 'Beauty & Care',     isFeatured: true,  image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800' },
  { name: 'Books & Media',     isFeatured: false, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800' },
  { name: 'Toys & Games',      isFeatured: false, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
  { name: 'Automotive',        isFeatured: false, image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' },
];

// Each product: { name, category, price, stock, isFeatured, rating, salesCount, description, thumbnail }
const PRODUCTS_DATA = [
  // ── Electronics ──
  {
    category: 'Electronics', name: 'Sony WH-1000XM5 Headphones',
    price: 349.99, stock: 45, isFeatured: true, rating: { average: 4.8, count: 312 }, salesCount: 312,
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charging. Lightweight folding design.',
  },
  {
    category: 'Electronics', name: 'Apple iPad Air 11" M2',
    price: 599.99, stock: 30, isFeatured: true, rating: { average: 4.9, count: 528 }, salesCount: 528,
    thumbnail: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
    description: 'Supercharged by M2 chip. Brilliant 11-inch Liquid Retina display with True Tone. Works with Apple Pencil Pro and Magic Keyboard Folio.',
  },
  {
    category: 'Electronics', name: 'Samsung 55" QLED 4K Smart TV',
    price: 799.00, stock: 18, isFeatured: true, rating: { average: 4.7, count: 210 }, salesCount: 210,
    thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4fec4?w=800',
    description: 'Quantum Dot technology for over a billion shades of brilliant color. Object Tracking Sound syncs audio to on-screen action.',
  },
  {
    category: 'Electronics', name: 'Logitech MX Master 3S Mouse',
    price: 99.99, stock: 80, isFeatured: false, rating: { average: 4.8, count: 640 }, salesCount: 640,
    thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
    description: 'Ultra-fast MagSpeed electromagnetic scroll. 8000 DPI optical sensor. Works on any surface including glass. USB-C charging.',
  },
  {
    category: 'Electronics', name: 'DJI Mini 4 Pro Drone',
    price: 759.00, stock: 12, isFeatured: true, rating: { average: 4.9, count: 87 }, salesCount: 87,
    thumbnail: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
    description: '4K/60fps video. Omnidirectional obstacle sensing. Up to 34 minutes flight time. Under 249g — no registration required in most countries.',
  },
  {
    category: 'Electronics', name: 'KeyClick Mechanical Keyboard',
    price: 89.99, stock: 30, isFeatured: false, rating: { average: 4.8, count: 124 }, salesCount: 124,
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
    description: 'Tenkeyless mechanical keyboard with hot-swappable linear switches, per-key RGB backlighting, and solid CNC aluminum case.',
  },
  // ── Fashion & Apparel ──
  {
    category: 'Fashion & Apparel', name: "Levi's 501 Original Jeans",
    price: 89.99, stock: 120, isFeatured: true, rating: { average: 4.5, count: 890 }, salesCount: 890,
    thumbnail: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800',
    description: "The original blue jean since 1873. Straight fit with button fly. Durable denim that only gets better with age.",
  },
  {
    category: 'Fashion & Apparel', name: 'Nike Air Max 270',
    price: 149.99, stock: 65, isFeatured: true, rating: { average: 4.6, count: 450 }, salesCount: 450,
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    description: "Nike's biggest Air unit yet for maximum cushioning. Lightweight mesh upper. Available in multiple colorways.",
  },
  {
    category: 'Fashion & Apparel', name: 'Cashmere Blend Turtleneck',
    price: 129.00, stock: 40, isFeatured: false, rating: { average: 4.7, count: 203 }, salesCount: 203,
    thumbnail: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
    description: 'Luxuriously soft premium cashmere blend. Ribbed collar and cuffs. Relaxed fit. Available in 8 classic colors.',
  },
  {
    category: 'Fashion & Apparel', name: 'Ray-Ban Aviator Sunglasses',
    price: 179.00, stock: 55, isFeatured: true, rating: { average: 4.8, count: 370 }, salesCount: 370,
    thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
    description: 'Classic gold frame with G-15 green lenses. UV400 protection. Timeless design worn since 1937.',
  },
  {
    category: 'Fashion & Apparel', name: 'Minimalist Leather Backpack',
    price: 199.99, stock: 15, isFeatured: true, rating: { average: 4.7, count: 180 }, salesCount: 180,
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    description: 'Handcrafted full-grain leather. Fits 15-inch laptop. Hidden anti-theft compartment. Brass hardware.',
  },
  // ── Home & Living ──
  {
    category: 'Home & Living', name: 'Nespresso Vertuo Next Coffee',
    price: 199.00, stock: 35, isFeatured: true, rating: { average: 4.7, count: 318 }, salesCount: 318,
    thumbnail: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
    description: 'Brew 5 cup sizes from espresso to Alto XL. Centrifusion extraction technology. One-touch Bluetooth control.',
  },
  {
    category: 'Home & Living', name: 'Le Creuset Dutch Oven 5.5Qt',
    price: 399.95, stock: 22, isFeatured: true, rating: { average: 4.9, count: 156 }, salesCount: 156,
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    description: 'Enameled cast iron for even heat distribution. Induction compatible. Tight-fitting lid seals in flavor. Lifetime warranty.',
  },
  {
    category: 'Home & Living', name: 'Dyson V15 Detect Vacuum',
    price: 749.99, stock: 15, isFeatured: true, rating: { average: 4.8, count: 224 }, salesCount: 224,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    description: 'Laser reveals invisible dust. HEPA filtration captures 99.99% of particles. Up to 60-minute runtime on one charge.',
  },
  {
    category: 'Home & Living', name: 'AromaZen Scented Candle Set',
    price: 44.99, stock: 120, isFeatured: false, rating: { average: 4.6, count: 290 }, salesCount: 290,
    thumbnail: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800',
    description: 'Set of 3 organic soy wax candles. Hand-poured in reusable amber glass jars. Scents: Lavender, Eucalyptus, Sandalwood.',
  },
  // ── Sports & Outdoors ──
  {
    category: 'Sports & Outdoors', name: 'Garmin Forerunner 265 Watch',
    price: 449.99, stock: 28, isFeatured: true, rating: { average: 4.8, count: 189 }, salesCount: 189,
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    description: 'AMOLED display. Advanced running dynamics. Body Battery energy monitoring. Up to 15 days battery life.',
  },
  {
    category: 'Sports & Outdoors', name: 'Hydro Flask 32oz Water Bottle',
    price: 49.95, stock: 90, isFeatured: false, rating: { average: 4.9, count: 1200 }, salesCount: 1200,
    thumbnail: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
    description: 'TempShield double-wall vacuum insulation. Keeps cold 24h, hot 12h. 18/8 pro-grade stainless steel. Lifetime warranty.',
  },
  {
    category: 'Sports & Outdoors', name: 'Premium Non-Slip Yoga Mat',
    price: 79.00, stock: 60, isFeatured: false, rating: { average: 4.6, count: 550 }, salesCount: 550,
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    description: '6mm thick eco-friendly TPE foam. Alignment lines for perfect positioning. Carry strap included. Non-toxic and odor-free.',
  },
  // ── Beauty & Care ──
  {
    category: 'Beauty & Care', name: 'La Mer The Moisturizing Cream',
    price: 345.00, stock: 20, isFeatured: true, rating: { average: 4.7, count: 143 }, salesCount: 143,
    thumbnail: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800',
    description: 'Legendary Miracle Broth from sea kelp heals, soothes, and deeply hydrates. Firms and plumps skin visibly.',
  },
  {
    category: 'Beauty & Care', name: 'Dyson Airwrap Complete Styler',
    price: 599.99, stock: 18, isFeatured: true, rating: { average: 4.8, count: 275 }, salesCount: 275,
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
    description: 'Styles and dries simultaneously without extreme heat. Curls, waves, volumizes, and smoothes. Includes 6 attachments.',
  },
  // ── Books & Media ──
  {
    category: 'Books & Media', name: 'Kindle Paperwhite 16GB',
    price: 149.99, stock: 50, isFeatured: false, rating: { average: 4.8, count: 890 }, salesCount: 890,
    thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800',
    description: '300 ppi glare-free display. Adjustable warm light. Waterproof (IPX8). Up to 10 weeks on a single charge.',
  },
  // ── Automotive ──
  {
    category: 'Automotive', name: 'Garmin DriveSmart 76 GPS',
    price: 249.99, stock: 25, isFeatured: false, rating: { average: 4.6, count: 312 }, salesCount: 312,
    thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
    description: '7-inch display with bright sunlight visibility. Driver alerts for fatigue, school zones, and sharp curves. Live traffic & maps.',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const seedProducts = async () => {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // ── Wipe products & categories only (keep users/vendors from seed.js)
    console.log('🗑️  Clearing products & categories...');
    await Product.deleteMany();
    await Category.deleteMany();
    await Vendor.deleteMany();

    // ── Ensure a vendor user exists (reuse seller1 from seed.js, or create one)
    let sellerUser = await User.findOne({ email: 'seller1@luxora.com' });
    if (!sellerUser) {
      console.log('👤 Creating seller user...');
      sellerUser = await User.create({
        firstName: 'Lumina', lastName: 'Store',
        email: 'seller1@luxora.com', password: 'Password123!',
        role: userRoles.SELLER, isEmailVerified: true,
      });
    }

    // ── Create vendor
    console.log('🏪 Creating vendor...');
    const vendor = new Vendor({
      user: sellerUser._id,
      storeName: 'Lumina Lounge',
      storeDescription: 'Your premium destination for curated electronics, apparel, home & lifestyle.',
      businessEmail: 'seller1@luxora.com',
      businessPhone: '+1-555-100-0001',
      status: 'approved',
      isVerified: true,
      totalSales: 5800,
      totalRevenue: 890000,
      averageRating: 4.8,
    });
    await vendor.save();

    // ── Create categories (triggers slug hook)
    console.log('📂 Creating categories...');
    const catMap = {};
    for (const cd of CATEGORIES_DATA) {
      const cat = new Category({ name: cd.name, isFeatured: cd.isFeatured, isActive: true, image: { url: cd.image } });
      await cat.save();
      catMap[cd.name] = cat;
    }
    console.log(`   ✅ ${CATEGORIES_DATA.length} categories`);

    // ── Create products (one by one to trigger slug pre-save hook)
    console.log('📦 Creating products...');
    let created = 0;
    for (const pd of PRODUCTS_DATA) {
      const cat = catMap[pd.category];
      if (!cat) { console.warn(`   ⚠️  Category "${pd.category}" not found, skipping ${pd.name}`); continue; }
      const product = new Product({
        vendor: vendor._id,
        category: cat._id,
        name: pd.name,
        description: pd.description,
        price: pd.price,
        stock: pd.stock,
        isFeatured: pd.isFeatured,
        status: 'approved',
        isActive: true,
        salesCount: pd.salesCount,
        rating: pd.rating,
        thumbnail: { url: pd.thumbnail },
        images: [{ url: pd.thumbnail, alt: pd.name, order: 0 }],
      });
      await product.save();
      created++;
    }

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 PRODUCT SEED COMPLETED!');
    console.log('═══════════════════════════════════════');
    console.log(`   📂 Categories : ${CATEGORIES_DATA.length}`);
    console.log(`   📦 Products   : ${created}`);
    console.log(`   🏪 Vendor     : Lumina Lounge (seller1@luxora.com)`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedProducts();
