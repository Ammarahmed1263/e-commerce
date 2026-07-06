import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { authLimiter } from '../config/rateLimiter.js';
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../validators/authValidation.js';

const router = Router();

router.post(
  "/register",
  // authLimiter,
  validate(registerValidation),
  authController.register,
);
router.post(
  "/login",
  // authLimiter,
  validate(loginValidation),
  authController.login,
);
router.post("/google", authController.googleLogin);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/verify-email",
  validate(verifyEmailValidation),
  authController.verifyEmail,
);
router.post(
  "/resend-verification",
  validate(resendVerificationValidation),
  authController.resendVerification,
);
router.post(
  "/forgot-password",
  // authLimiter,
  validate(forgotPasswordValidation),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  // authLimiter,
  validate(resetPasswordValidation),
  authController.resetPassword,
);


router.get('/me', authMiddleware, authController.getMe);

export default router;
