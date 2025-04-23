const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Save Image (upload)
const saveImage = async (image, bucket) => {
  const result = await cloudinary.uploader.upload(image.path || image, {
    folder: bucket,
  });

  return result.public_id;
};

// Get Image (download)
const downloadImage = (photoLink, bucket) => {
  return cloudinary.url(`${bucket}/${photoLink}`, {
    secure: true,
  });
};

// Delete Image
const deleteImage = async (photoLink, bucket) => {
  const publicId = `${bucket}/${photoLink}`;
  return await cloudinary.uploader.destroy(publicId);
};

// Update Image
const updateImage = async (photoLink, bucket, image) => {
  const publicId = `${bucket}/${photoLink}`;

  await cloudinary.uploader.destroy(publicId);

  const result = await cloudinary.uploader.upload(image.path || image, {
    public_id: publicId,
    overwrite: true,
  });

  return result.public_id;
};

// Export all functions
module.exports = {
  saveImage,
  downloadImage,
  deleteImage,
  updateImage
};
