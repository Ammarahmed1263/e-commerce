import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';
import { updateProfileValidation } from '../validators/userValidation.js';
import { changePasswordValidation } from '../validators/authValidation.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /users/me - fetch current user profile
router.get('/me', userController.getMe);

// PATCH /users/me - update profile (replaces /users/profile)
router.patch('/me', validate(updateProfileValidation), userController.updateProfile);

// POST /users/me/avatar - upload avatar
// DELETE /users/me/avatar - remove avatar (reuse updateAvatar logic with empty file handling)
router.post('/me/avatar', uploadAvatar.single('avatar'), userController.updateAvatar);

// GET /users/me/orders - fetch current user's orders
router.get('/me/orders', userController.getMyOrders);

// GET /users/me/reviews - fetch current user's reviews
router.get('/me/reviews', userController.getMyReviews);

// PATCH /users/password - change password (kept for backward compat)
router.patch('/password', validate(changePasswordValidation), userController.changePassword);

// DELETE /users/account - soft-delete account
router.delete('/account', userController.deleteAccount);

// Keep legacy aliases so any existing calls don't break
router.patch('/profile', validate(updateProfileValidation), userController.updateProfile);
router.patch('/avatar', uploadAvatar.single('avatar'), userController.updateAvatar);

export default router;
