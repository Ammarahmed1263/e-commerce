import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { userRoles } from '../utils/userRoles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Helpers ────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const orderStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatuses = ['pending', 'paid', 'paid', 'paid', 'failed'];

// ─── Seed Data ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Electronics',      isFeatured: true,  image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
  { name: 'Fashion & Apparel',isFeatured: true,  image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
  { name: 'Home & Living',    isFeatured: true,  image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400' },
  { name: 'Sports & Outdoors',isFeatured: true,  image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400' },
  { name: 'Beauty & Care',    isFeatured: true,  image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400' },
  { name: 'Books & Media',    isFeatured: false, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400' },
  { name: 'Toys & Games',     isFeatured: false, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  { name: 'Automotive',       isFeatured: false, image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400' },
];

const PRODUCTS_DATA = [
  // Electronics
  { name: 'Sony WH-1000XM5 Headphones',   price: 349.99, stock: 45, category: 'Electronics',       rating: 4.8, sales: 312, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charging.' },
  { name: 'Apple iPad Air 11" M2',         price: 599.99, stock: 30, category: 'Electronics',       rating: 4.9, sales: 528, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600', description: 'Supercharged by M2 chip. Brilliant 11-inch Liquid Retina display. Works with Apple Pencil Pro and Magic Keyboard.' },
  { name: 'Samsung 4K Smart TV 55"',       price: 799.00, stock: 18, category: 'Electronics',       rating: 4.7, sales: 210, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4fec4?w=600', description: 'Crystal UHD 4K resolution. PurColor for rich, natural color. Alexa built-in with smart home compatibility.' },
  { name: 'Logitech MX Master 3S Mouse',   price: 99.99,  stock: 80, category: 'Electronics',       rating: 4.8, sales: 640, featured: false, thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', description: 'Ultra-fast MagSpeed scroll. Ergonomic shape with 7 buttons. Works on any surface including glass.' },
  { name: 'DJI Mini 4 Pro Drone',          price: 759.00, stock: 12, category: 'Electronics',       rating: 4.9, sales: 87,  featured: true,  thumbnail: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600', description: '4K/60fps video with omnidirectional obstacle sensing. Up to 34 min flight time. Under 249g.' },

  // Fashion
  { name: 'Levi\'s 501 Original Jeans',   price: 89.99,  stock: 120, category: 'Fashion & Apparel', rating: 4.5, sales: 890, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600', description: 'The original blue jean since 1873. Straight fit, button fly, durable denim. Available in multiple washes.' },
  { name: 'Nike Air Max 270',              price: 149.99, stock: 65,  category: 'Fashion & Apparel', rating: 4.6, sales: 450, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', description: 'Inspired by the Air Max 180 and 93. The biggest heel Air unit yet for lightweight cushioning all day.' },
  { name: 'Cashmere Blend Turtleneck',     price: 129.00, stock: 40,  category: 'Fashion & Apparel', rating: 4.7, sales: 203, featured: false, thumbnail: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600', description: 'Luxuriously soft cashmere blend. Ribbed collar and cuffs. Available in 8 classic colors.' },
  { name: 'Ray-Ban Aviator Sunglasses',    price: 179.00, stock: 55,  category: 'Fashion & Apparel', rating: 4.8, sales: 370, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600', description: 'Classic gold frame with G-15 green lenses. Timeless design since 1937. UV400 protection.' },

  // Home & Living
  { name: 'Nespresso Vertuo Next Coffee',  price: 199.00, stock: 35, category: 'Home & Living',      rating: 4.7, sales: 318, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600', description: 'Brew 5 cup sizes from espresso to Alto XL. Centrifusion extraction. One-touch Bluetooth control.' },
  { name: 'Le Creuset Dutch Oven 5.5 Qt', price: 399.95, stock: 22, category: 'Home & Living',      rating: 4.9, sales: 156, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', description: 'Enameled cast iron for even heat distribution. Compatible with all cooktops including induction. Lifetime warranty.' },
  { name: 'Dyson V15 Detect Vacuum',       price: 749.99, stock: 15, category: 'Home & Living',      rating: 4.8, sales: 224, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', description: 'Laser detects dust you can\'t see. HEPA filtration captures 99.99% particles. Up to 60 min runtime.' },
  { name: 'Philips Hue Starter Kit',       price: 199.95, stock: 50, category: 'Home & Living',      rating: 4.6, sales: 427, featured: false, thumbnail: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600', description: '3 smart bulbs + bridge. 16 million colors. Control with voice or app. Syncs with movies and music.' },

  // Sports
  { name: 'Garmin Forerunner 265 Watch',   price: 449.99, stock: 28, category: 'Sports & Outdoors',  rating: 4.8, sales: 189, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', description: 'AMOLED display. Advanced running dynamics. Up to 15 days battery life. Built-in GPS.' },
  { name: 'Hydro Flask 32oz Water Bottle', price: 49.95,  stock: 90, category: 'Sports & Outdoors',  rating: 4.9, sales: 1200,featured: false, thumbnail: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', description: 'TempShield double-wall insulation. 18/8 pro-grade stainless steel. Keeps cold 24h, hot 12h.' },
  { name: 'Yoga Mat Premium Non-Slip',     price: 79.00,  stock: 60, category: 'Sports & Outdoors',  rating: 4.6, sales: 550, featured: false, thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', description: '6mm thick TPE foam. Alignment lines for perfect pose. Includes carry strap. Eco-friendly materials.' },

  // Beauty
  { name: 'La Mer The Moisturizing Cream', price: 345.00, stock: 20, category: 'Beauty & Care',      rating: 4.7, sales: 143, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600', description: 'Legendary sea kelp ferment heals and soothes. Firms, plumps, and deeply hydrates. For all skin types.' },
  { name: 'Dyson Airwrap Styler',          price: 599.99, stock: 18, category: 'Beauty & Care',      rating: 4.8, sales: 275, featured: true,  thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', description: 'Styles and dries simultaneously. No extreme heat. Curls, waves, volumizes, and smoothes.' },
];

const REVIEW_TITLES = [
  'Absolutely love it!', 'Great quality for the price', 'Exceeded my expectations',
  'Solid product, highly recommend', 'Worth every penny', 'Amazing!',
  'Good but could be better', 'Exactly as described', 'Very happy with my purchase',
  'Fast shipping, great product',
];

const REVIEW_BODIES = [
  'I\'ve been using this for a few weeks now and it\'s been fantastic. The build quality is excellent and it performs exactly as advertised.',
  'Really impressed with the quality. Delivery was fast and packaging was great. Would definitely recommend to anyone looking for this type of product.',
  'Perfect for my needs. Easy to set up and use. The customer service from the vendor was also very helpful when I had questions.',
  'I was a bit skeptical at first given the price, but this product completely changed my mind. It\'s worth every penny.',
  'The quality is top-notch. I\'ve tried similar products before, but this one stands out. Very happy with my purchase.',
  'Great value for money. Works exactly as described. Shipping was quicker than expected. Will definitely buy again.',
  'Five stars without hesitation. This product has made my daily routine so much easier. Highly recommend!',
];

// ─── Main Seed Function ──────────────────────────────────────────────────────
const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    console.log('🗑️  Clearing existing data...');

    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Vendor.deleteMany(),
      Product.deleteMany(),
      Order.deleteMany(),
      Review.deleteMany(),
    ]);

    console.log('✅ Collections cleared\n');

    // ── 1. Users ────────────────────────────────────────────────────────────
    console.log('👤 Creating users...');

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Luxora',
      email: 'admin@luxora.com',
      password: 'Password123!',
      role: userRoles.ADMIN,
      isEmailVerified: true,
      phone: '+1-555-000-0001',
    });

    const sellerUsers = await User.insertMany([
      { firstName: 'TechZone',   lastName: 'Store',  email: 'seller1@luxora.com', password: 'Password123!', role: userRoles.SELLER, isEmailVerified: true, phone: '+1-555-100-0001' },
      { firstName: 'StyleHub',   lastName: 'Shop',   email: 'seller2@luxora.com', password: 'Password123!', role: userRoles.SELLER, isEmailVerified: true, phone: '+1-555-100-0002' },
      { firstName: 'HomeGarden', lastName: 'Co.',    email: 'seller3@luxora.com', password: 'Password123!', role: userRoles.SELLER, isEmailVerified: true, phone: '+1-555-100-0003' },
    ]);

    const customerUsers = await User.insertMany([
      { firstName: 'Sarah',   lastName: 'Johnson', email: 'sarah@example.com',   password: 'Password123!', role: userRoles.CUSTOMER, isEmailVerified: true,  phone: '+1-555-200-0001', address: { addressLine1: '123 Main St', city: 'New York',    state: 'NY', postalCode: '10001', country: 'US' } },
      { firstName: 'Ahmed',   lastName: 'Hassan',  email: 'ahmed@example.com',   password: 'Password123!', role: userRoles.CUSTOMER, isEmailVerified: true,  phone: '+1-555-200-0002', address: { addressLine1: '456 Oak Ave', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'US' } },
      { firstName: 'Maria',   lastName: 'Garcia',  email: 'maria@example.com',   password: 'Password123!', role: userRoles.CUSTOMER, isEmailVerified: true,  phone: '+1-555-200-0003', address: { addressLine1: '789 Pine Rd', city: 'Chicago',     state: 'IL', postalCode: '60601', country: 'US' } },
      { firstName: 'James',   lastName: 'Wilson',  email: 'james@example.com',   password: 'Password123!', role: userRoles.CUSTOMER, isEmailVerified: false, phone: '+1-555-200-0004', address: { addressLine1: '321 Elm St', city: 'Houston',     state: 'TX', postalCode: '77001', country: 'US' } },
      { firstName: 'Farida',  lastName: 'Ahmed',   email: 'farida@example.com',  password: 'Password123!', role: userRoles.CUSTOMER, isEmailVerified: true,  phone: '+20-555-200-0005',address: { addressLine1: '10 Tahrir Sq', city: 'Cairo',      state: 'Cairo', postalCode: '11511', country: 'EG' } },
    ]);

    console.log(`   ✅ 1 admin, ${sellerUsers.length} sellers, ${customerUsers.length} customers`);

    // ── 2. Categories ────────────────────────────────────────────────────────
    console.log('📂 Creating categories...');
    const categories = [];
    for (const cat of CATEGORIES) {
      const c = new Category({ name: cat.name, isFeatured: cat.isFeatured, isActive: true, image: { url: cat.image } });
      await c.save(); // triggers slug pre-save hook
      categories.push(c);
    }
    const catMap = Object.fromEntries(categories.map(c => [c.name, c]));
    console.log(`   ✅ ${categories.length} categories`);

    // ── 3. Vendors ───────────────────────────────────────────────────────────
    console.log('🏪 Creating vendors...');
    const vendorDefs = [
      { user: sellerUsers[0], storeName: 'TechZone Official',  storeDescription: 'Your one-stop shop for the latest electronics and gadgets.', businessEmail: 'seller1@luxora.com', status: 'approved', isVerified: true,  totalSales: 1580, totalRevenue: 284200 },
      { user: sellerUsers[1], storeName: 'StyleHub Boutique',  storeDescription: 'Premium fashion and lifestyle products for the modern wardrobe.', businessEmail: 'seller2@luxora.com', status: 'approved', isVerified: true,  totalSales: 912,  totalRevenue: 134800 },
      { user: sellerUsers[2], storeName: 'HomeGarden Co.',     storeDescription: 'Beautiful home decor and garden essentials to transform your space.', businessEmail: 'seller3@luxora.com', status: 'approved', isVerified: false, totalSales: 420,  totalRevenue: 89600 },
    ];
    const vendors = [];
    for (const v of vendorDefs) {
      const vendor = new Vendor({ user: v.user._id, storeName: v.storeName, storeDescription: v.storeDescription, businessEmail: v.businessEmail, status: v.status, isVerified: v.isVerified, totalSales: v.totalSales, totalRevenue: v.totalRevenue, averageRating: +(3.8 + Math.random() * 1.1).toFixed(1) });
      await vendor.save();
      vendors.push(vendor);
    }
    // Assign vendors to seller users by role
    const vendorMap = { 'Electronics': vendors[0], 'Fashion & Apparel': vendors[1], 'Sports & Outdoors': vendors[1], 'Beauty & Care': vendors[2], 'Home & Living': vendors[2], 'Books & Media': vendors[2], 'Toys & Games': vendors[2], 'Automotive': vendors[0] };
    console.log(`   ✅ ${vendors.length} vendors`);

    // ── 4. Products ──────────────────────────────────────────────────────────
    console.log('📦 Creating products...');
    const products = [];
    for (const pd of PRODUCTS_DATA) {
      const cat = catMap[pd.category];
      const vendor = vendorMap[pd.category];
      const product = new Product({
        vendor: vendor._id,
        category: cat._id,
        name: pd.name,
        description: pd.description,
        price: pd.price,
        stock: pd.stock,
        isFeatured: pd.featured,
        status: 'approved',
        isActive: true,
        salesCount: pd.sales,
        rating: { average: pd.rating, count: rand(50, 600) },
        thumbnail: { url: pd.thumbnail },
        images: [{ url: pd.thumbnail, alt: pd.name, order: 0 }],
      });
      await product.save();
      products.push(product);
    }
    console.log(`   ✅ ${products.length} products`);

    // ── 5. Orders ────────────────────────────────────────────────────────────
    console.log('🛒 Creating orders...');
    const orders = [];
    const addresses = [
      { firstName: 'Sarah',  lastName: 'Johnson', phone: '+1-555-200-0001', addressLine1: '123 Main St',  city: 'New York',    state: 'NY', postalCode: '10001', country: 'US' },
      { firstName: 'Ahmed',  lastName: 'Hassan',  phone: '+1-555-200-0002', addressLine1: '456 Oak Ave',  city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'US' },
      { firstName: 'Maria',  lastName: 'Garcia',  phone: '+1-555-200-0003', addressLine1: '789 Pine Rd',  city: 'Chicago',     state: 'IL', postalCode: '60601', country: 'US' },
      { firstName: 'James',  lastName: 'Wilson',  phone: '+1-555-200-0004', addressLine1: '321 Elm St',   city: 'Houston',     state: 'TX', postalCode: '77001', country: 'US' },
      { firstName: 'Farida', lastName: 'Ahmed',   phone: '+20-555-200-0005',addressLine1: '10 Tahrir Sq', city: 'Cairo',       state: 'Cairo', postalCode: '11511', country: 'EG' },
    ];

    // Spread orders over the last 12 months
    const now = new Date();
    for (let i = 0; i < 40; i++) {
      const customer = pick(customerUsers);
      const addrIdx = customerUsers.indexOf(customer);
      const addr = addresses[addrIdx] || addresses[0];
      const orderProducts = [pick(products), pick(products)].filter((p, idx, self) => self.indexOf(p) === idx).slice(0, rand(1, 2));
      const items = orderProducts.map(p => ({
        product: p._id,
        vendor: p.vendor,
        name: p.name,
        thumbnail: p.thumbnail?.url,
        quantity: rand(1, 3),
        unitPrice: p.price,
        totalPrice: +(p.price * rand(1, 3)).toFixed(2),
      }));
      const subtotal = +items.reduce((s, it) => s + it.totalPrice, 0).toFixed(2);
      const shipping = subtotal > 100 ? 0 : 9.99;
      const tax = +(subtotal * 0.08).toFixed(2);
      const total = +(subtotal + shipping + tax).toFixed(2);
      const status = pick(orderStatuses);
      const payStatus = status === 'cancelled' ? 'failed' : status === 'delivered' ? 'paid' : pick(paymentStatuses);

      // Random date within last 12 months
      const daysAgo = rand(0, 365);
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const order = await Order.create({
        orderNumber: `LUX-${String(1000 + i).padStart(5, '0')}`,
        user: customer._id,
        items,
        shippingAddress: addr,
        billingAddress: addr,
        summary: { subtotal, shipping, tax, discount: 0, couponDiscount: 0, total },
        status,
        paymentStatus: payStatus,
        paymentMethod: pick(['stripe', 'stripe', 'cash_on_delivery']),
        statusHistory: [{ status, timestamp: createdAt }],
        createdAt,
        updatedAt: createdAt,
      });
      orders.push(order);
    }
    console.log(`   ✅ ${orders.length} orders`);

    // ── 6. Reviews ───────────────────────────────────────────────────────────
    console.log('⭐ Creating reviews...');
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const reviewedPairs = new Set();
    let reviewCount = 0;

    for (const order of deliveredOrders.slice(0, 20)) {
      for (const item of order.items.slice(0, 1)) {
        const key = `${item.product}-${order.user}`;
        if (reviewedPairs.has(key)) continue;
        reviewedPairs.add(key);
        await Review.create({
          product: item.product,
          user: order.user,
          order: order._id,
          rating: rand(3, 5),
          title: pick(REVIEW_TITLES),
          body: pick(REVIEW_BODIES),
          verifiedPurchase: true,
          status: 'approved',
        });
        reviewCount++;
      }
    }
    console.log(`   ✅ ${reviewCount} reviews`);

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Login Credentials:');
    console.log('   👑 Admin    → admin@luxora.com    / Password123!');
    console.log('   🏪 Seller 1 → seller1@luxora.com  / Password123!  (TechZone Official)');
    console.log('   🏪 Seller 2 → seller2@luxora.com  / Password123!  (StyleHub Boutique)');
    console.log('   🏪 Seller 3 → seller3@luxora.com  / Password123!  (HomeGarden Co.)');
    console.log('   👤 Customer → sarah@example.com   / Password123!');
    console.log('   👤 Customer → ahmed@example.com   / Password123!');
    console.log('   👤 Customer → farida@example.com  / Password123!');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedData();
