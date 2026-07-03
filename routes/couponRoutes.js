import { Router } from 'express';
import * as couponController from '../controllers/couponController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';

const router = Router();

router.use(authMiddleware, allowTo(userRoles.ADMIN));

router.post('/', couponController.createCoupon);
router.get('/', couponController.getCoupons);
router.patch('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

export default router;
