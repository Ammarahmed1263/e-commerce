import { Router } from 'express';
import * as cartController from '../controllers/cartController.js';
import validate from '../middlewares/validateMiddleware.js';
import optionalAuthMiddleware from '../middlewares/optionalAuthMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  addItemValidation,
  updateItemValidation,
  couponValidation,
  mergeCartValidation
} from '../validators/cartValidation.js';

const router = Router();

router.get('/', optionalAuthMiddleware, cartController.getCart);
router.post('/items', optionalAuthMiddleware, validate(addItemValidation), cartController.addItem);
router.patch('/items/:itemId', optionalAuthMiddleware, validate(updateItemValidation), cartController.updateItem);
router.delete('/items/:itemId', optionalAuthMiddleware, cartController.removeItem);
router.delete('/', optionalAuthMiddleware, cartController.clearCart);
router.post('/coupon', optionalAuthMiddleware, validate(couponValidation), cartController.applyCoupon);
router.delete('/coupon', optionalAuthMiddleware, cartController.removeCoupon);

router.post('/merge', authMiddleware, validate(mergeCartValidation), cartController.mergeCart);

export default router;
