import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import optionalAuthMiddleware from '../middlewares/optionalAuthMiddleware.js';
import { createOrderValidation, cancelOrderValidation } from '../validators/orderValidation.js';

const router = Router();

// router.use(authMiddleware);

router.post('/',optionalAuthMiddleware, validate(createOrderValidation), orderController.createOrder);
router.get('/',authMiddleware, orderController.getOrders);
router.get('/:orderId',authMiddleware, orderController.getOrder);
router.patch('/:orderId/cancel',authMiddleware, validate(cancelOrderValidation), orderController.cancelOrder);

export default router;
