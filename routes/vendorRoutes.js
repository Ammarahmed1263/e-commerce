import { Router } from 'express';
import * as vendorController from '../controllers/vendorController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { uploadVendor } from '../middlewares/uploadMiddleware.js';
import { registerVendorValidation, updateVendorValidation } from '../validators/vendorValidation.js';

const router = Router();

// Public routes
router.get('/', vendorController.getVendors);
router.get('/:slug', vendorController.getVendor);

// Protected routes
router.use(authMiddleware);

router.post('/register', validate(registerVendorValidation), vendorController.registerVendor);

// Vendor specific routes
router.get('/dashboard/me', allowTo(userRoles.SELLER, userRoles.ADMIN), vendorController.getVendorDashboard);
router.patch('/profile/me', allowTo(userRoles.SELLER, userRoles.ADMIN), validate(updateVendorValidation), vendorController.updateVendorProfile);

// Note: Admin vendor approval is in adminRoutes.js

export default router;
