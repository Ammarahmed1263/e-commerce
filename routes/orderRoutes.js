import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createOrderValidation, cancelOrderValidation } from '../validators/orderValidation.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createOrderValidation), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrder);
router.patch('/:orderId/cancel', validate(cancelOrderValidation), orderController.cancelOrder);

export default router;
