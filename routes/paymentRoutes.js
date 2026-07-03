import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { createCheckoutSessionValidation, refundValidation } from '../validators/paymentValidation.js';

const router = Router();

router.use(authMiddleware);

// Create Stripe Checkout Session
router.post('/stripe/create-session', validate(createCheckoutSessionValidation), paymentController.createCheckoutSession);

// Admin routes
router.post('/refund', allowTo(userRoles.ADMIN), validate(refundValidation), paymentController.initiateRefund);

export default router;
