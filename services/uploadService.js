import cloudinary from '../config/cloudinary.js';

export const deleteCloudinaryImage = async (publicId) => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
  }
};
