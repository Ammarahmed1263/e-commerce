import multer from 'multer';
import CloudinaryStorage from '../utils/cloudinaryStorage.js';

const createUploader = ({ folder, transformation, allowedFormats, maxSizeMB = 10 }) => {
  const storage = new CloudinaryStorage({ folder, transformation, allowedFormats });
  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
      }
    }
  });
};

export const uploadAvatar = createUploader({
  folder: 'avatars',
  transformation: { width: 400, height: 400, crop: 'fill' },
  maxSizeMB: 5
});

export const uploadProduct = createUploader({
  folder: 'products',
  transformation: { width: 1200, height: 1200, crop: 'limit' },
  maxSizeMB: 10
});

export const uploadCategory = createUploader({
  folder: 'categories',
  transformation: { width: 800, height: 800, crop: 'fill' },
  maxSizeMB: 5
});

export const uploadVendor = createUploader({
  folder: 'vendors',
  transformation: { width: 800, height: 800, crop: 'fill' },
  maxSizeMB: 5
});

export const uploadBanner = createUploader({
  folder: 'banners',
  transformation: { width: 1920, height: 600, crop: 'fill' },
  maxSizeMB: 10
});

export const uploadReview = createUploader({
  folder: 'reviews',
  transformation: { width: 1200, height: 1200, crop: 'limit' },
  maxSizeMB: 5
});
