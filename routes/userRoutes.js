import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';
import { updateProfileValidation } from '../validators/userValidation.js';
import { changePasswordValidation } from '../validators/authValidation.js';

const router = Router();

router.use(authMiddleware);

router.patch('/profile', validate(updateProfileValidation), userController.updateProfile);
router.patch('/avatar', uploadAvatar.single('avatar'), userController.updateAvatar);
router.patch('/password', validate(changePasswordValidation), userController.changePassword);
router.get('/me/reviews', userController.getMyReviews);
router.delete('/account', userController.deleteAccount);

export default router;
