import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { reviewModerationValidation, vendorModerationValidation } from '../validators/adminValidation.js';

const router = Router();

// Secure all admin routes
router.use(authMiddleware, allowTo(userRoles.ADMIN));

// Stats & charts routes
router.get('/dashboard', adminController.getDashboardStats);
router.get('/stats', adminController.getStats);
router.get('/revenue-chart', adminController.getRevenueChart);
router.get('/recent-orders', adminController.getRecentOrders);
router.get('/top-products', adminController.getTopProducts);
router.get('/recent-users', adminController.getRecentUsers);
router.get('/category-chart', adminController.getCategoryChart);
router.get('/order-status-chart', adminController.getOrderStatusChart);

// Review moderation
router.patch('/reviews/:id/moderate', validate(reviewModerationValidation), adminController.moderateReview);

// Vendor moderation & listing
router.get('/vendors', adminController.getVendors);
router.patch('/vendors/:id/moderate', validate(vendorModerationValidation), adminController.moderateVendor);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Product management
router.get('/products', adminController.getProducts);
router.patch('/products/:id/featured', adminController.toggleProductFeatured);
router.delete('/products/:id', adminController.deleteProduct);

// Order management
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

export default router;
