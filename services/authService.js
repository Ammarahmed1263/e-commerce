import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import AppError from '../utils/appError.js';
import { generateOtpCode } from '../utils/generateOTP.js';
import { sendSMS } from './SMSService.js';

export const generateAndSaveRefreshToken = async (userId) => {
  const token = generateRefreshToken({ id: userId });
  
  const decoded = jwt.decode(token);
  
  await RefreshToken.create({
    token,
    user: userId,
    expiresAt: new Date(decoded.exp * 1000)
  });
  
  return token;
};

export const rotateRefreshToken = async (oldToken) => {
  const existingToken = await RefreshToken.findOne({ token: oldToken });
  
  if (!existingToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
  
  if (existingToken.isRevoked) {
    throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
  }
  
  try {
    jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Refresh token expired or invalid', 401, 'TOKEN_EXPIRED');
  }
  
  existingToken.isRevoked = true;
  await existingToken.save();
  
  return await generateAndSaveRefreshToken(existingToken.user);
};

export const revokeRefreshToken = async (token) => {
  await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
};

export const verifyRefreshToken = async (token) => {
  const existingToken = await RefreshToken.findOne({ token, isRevoked: false });
  if (!existingToken) {
    throw new AppError('Refresh token not found or revoked', 401, 'INVALID_TOKEN');
  }
  
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  return decoded;
};

export const sendOtp = async (phoneNumber) => {
  await Otp.deleteMany({ phoneNumber });

  const otpCode = generateOtpCode();

  await Otp.create({ phoneNumber, otp: otpCode });

const smsMessage = `your OTP is ${otpCode}. valid for 5 minutes`;
  await sendSMS(phoneNumber, smsMessage);
  
  return { message: 'otp sent successfully' };
};

export const verifyOtp = async (phoneNumber, otpCode) => {
  const validOtp = await Otp.findOne({ phoneNumber, otp: otpCode });
  
  if (!validOtp) {
    throw new Error('invalid otp');
  }

  let user = await User.findOne({ phone:phoneNumber });
  
  if (!user) {
    user = await User.create({ phone:phoneNumber, isPhoneVerified: true });
  } else {
    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }
  }
  await Otp.deleteOne({ _id: validOtp._id });

  const token = generateAccessToken(user._id);

  return { 
    message: 'logged in successfully', 
    token, 
    user 
  };
};