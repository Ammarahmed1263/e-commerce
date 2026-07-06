import { Router } from 'express';
import * as newsletterController from '../controllers/newsletterController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';

const router = Router();

// Public routes
router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);

// Admin routes
router.use(authMiddleware, allowTo(userRoles.ADMIN));
router.get('/', newsletterController.getSubscribers);

export default router;
