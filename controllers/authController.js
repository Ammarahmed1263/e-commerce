import User from "../models/User.js";
import crypto from "crypto";
import AppError from "../utils/appError.js";
import { success, created } from "../utils/apiResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import {
  generateEmailToken,
  generateAccessToken,
} from "../utils/generateToken.js";
import * as authService from "../services/authService.js";
import * as emailService from "../services/emailService.js";

const setTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const register = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(
      new AppError("Email is already registered", 409, "EMAIL_EXISTS"),
    );
  }

  const emailVerificationToken = generateEmailToken();

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    emailVerificationToken: crypto
      .createHash("sha256")
      .update(emailVerificationToken)
      .digest("hex"),
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  await emailService.sendVerificationEmail(user, emailVerificationToken);

  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;

  return created(res, {
    message:
      "Registration successful. Please check your email to verify your account.",
    data: { user: userObject },
  });
});

export const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
      }
      await user.save({ validateBeforeSave: false });
    }
    return next(
      new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS"),
    );
  }

  if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
    return next(
      new AppError(
        "Account is temporarily locked. Try again later.",
        403,
        "ACCOUNT_LOCKED",
      ),
    );
  }

  if (!user.isActive) {
    return next(
      new AppError("Account has been deactivated.", 403, "ACCOUNT_INACTIVE"),
    );
  }

  user.failedLoginAttempts = 0;
  user.accountLockedUntil = undefined;
  user.lastLoginAt = Date.now();
  await user.save({ validateBeforeSave: false });

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = await authService.generateAndSaveRefreshToken(user._id);

  setTokenCookie(res, refreshToken);

  const userObject = user.toObject();
  delete userObject.password;

  return success(res, {
    message: "Login successful",
    data: { user: userObject, accessToken },
  });
});

export const logout = asyncWrapper(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await authService.revokeRefreshToken(refreshToken);
  }

  res.cookie("refreshToken", "loggedout", {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });

  return success(res, { message: "Logged out successfully" });
});

export const refreshToken = asyncWrapper(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return next(new AppError("No refresh token provided", 401, "UNAUTHORIZED"));
  }

  const newRefreshToken = await authService.rotateRefreshToken(token);
  const decoded = await authService.verifyRefreshToken(newRefreshToken);

  const user = await User.findById(decoded.id);
  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  setTokenCookie(res, newRefreshToken);

  return success(res, {
    message: "Token refreshed",
    data: { accessToken },
  });
});

export const verifyEmail = asyncWrapper(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("Token is invalid or has expired", 400, "INVALID_TOKEN"),
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await emailService.sendWelcomeEmail(user);

  return success(res, { message: "Email successfully verified" });
});

export const forgotPassword = asyncWrapper(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return success(res, {
      message: "If that email exists, a reset link has been sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
    return success(res, {
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later.",
        500,
      ),
    );
  }
});

export const resetPassword = asyncWrapper(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("Token is invalid or has expired", 400, "INVALID_TOKEN"),
    );
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return success(res, {
    message: "Password has been reset successfully. You can now log in.",
  });
});

export const getMe = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  return success(res, {
    message: "User profile retrieved",
    data: { user },
  });
});
