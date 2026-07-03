import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { reviewModerationValidation, vendorModerationValidation } from '../validators/adminValidation.js';

const router = Router();

router.use(authMiddleware, allowTo(userRoles.ADMIN));

router.get('/dashboard', adminController.getDashboardStats);
router.patch('/reviews/:id/moderate', validate(reviewModerationValidation), adminController.moderateReview);
router.patch('/vendors/:id/moderate', validate(vendorModerationValidation), adminController.moderateVendor);

export default router;
