import { Router } from 'express';
import * as bannerController from '../controllers/bannerController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowTo from '../middlewares/allowToMiddleware.js';
import { userRoles } from '../utils/userRoles.js';
import { uploadBanner } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.get('/', bannerController.getBanners);

router.use(authMiddleware, allowTo(userRoles.ADMIN));

router.post('/', uploadBanner.fields([{ name: 'desktop', maxCount: 1 }, { name: 'mobile', maxCount: 1 }]), bannerController.createBanner);
router.patch('/:id', uploadBanner.fields([{ name: 'desktop', maxCount: 1 }, { name: 'mobile', maxCount: 1 }]), bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

export default router;
