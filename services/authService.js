import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import { generateRefreshToken } from '../utils/generateToken.js';
import AppError from '../utils/appError.js';

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
