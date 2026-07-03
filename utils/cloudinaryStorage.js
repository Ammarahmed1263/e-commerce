import cloudinary from '../config/cloudinary.js';

class CloudinaryStorage {
  constructor({ folder, transformation, allowedFormats = ['jpg', 'jpeg', 'png', 'webp'] }) {
    this.folder = folder;
    this.transformation = transformation;
    this.allowedFormats = allowedFormats;
  }

  _handleFile(req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `luxora/${this.folder}`,
        allowed_formats: this.allowedFormats,
        transformation: this.transformation ? [this.transformation] : undefined,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          fieldname: file.fieldname,
          filename: result.public_id,
          path: result.secure_url,
          size: result.bytes,
          mimetype: file.mimetype
        });
      }
    );

    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, cb);
    } else {
      cb(null);
    }
  }
}

export default CloudinaryStorage;
