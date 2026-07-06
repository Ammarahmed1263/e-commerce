import { Router } from 'express';
import * as vendorController from '../controllers/vendorController.js';
import * as productController from '../controllers/productController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { uploadVendor } from '../middlewares/uploadMiddleware.js';
import { registerVendorValidation, updateVendorValidation } from '../validators/vendorValidation.js';

const router = Router();

// Public routes (must come before /:slug to avoid capture)
router.get('/', vendorController.getVendors);

// Protected routes
router.use(authMiddleware);

router.post('/register', validate(registerVendorValidation), vendorController.registerVendor);

// Vendor dashboard routes (declared before /:slug so "dashboard" isn't treated as a slug)
router.get('/dashboard/me', allowTo(userRoles.SELLER, userRoles.ADMIN), vendorController.getVendorDashboard);
router.get('/dashboard/stats', allowTo(userRoles.SELLER, userRoles.ADMIN), vendorController.getVendorStats);
router.get('/dashboard/revenue-chart', allowTo(userRoles.SELLER, userRoles.ADMIN), vendorController.getVendorRevenueChart);
router.get('/dashboard/products', allowTo(userRoles.SELLER, userRoles.ADMIN), vendorController.getVendorProducts);
router.get('/dashboard/orders', allowTo(userRoles.SELLER, userRoles.ADMIN), vendorController.getVendorOrders);
router.patch('/profile/me', allowTo(userRoles.SELLER, userRoles.ADMIN), validate(updateVendorValidation), vendorController.updateVendorProfile);

// Seller product CRUD (dashboard — uses productId not slug, accepts categoryName string)
router.post('/dashboard/products', allowTo(userRoles.SELLER, userRoles.ADMIN), productController.sellerAddProduct);
router.patch('/dashboard/products/:productId', allowTo(userRoles.SELLER, userRoles.ADMIN), productController.sellerUpdateProduct);
router.delete('/dashboard/products/:productId', allowTo(userRoles.SELLER, userRoles.ADMIN), productController.sellerDeleteProduct);

// Public slug route last so it doesn't swallow the dashboard paths
router.get('/:slug', vendorController.getVendor);

// Note: Admin vendor approval is in adminRoutes.js

export default router;
