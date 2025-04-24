const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dvqhr7kog",
  api_key: "212257242557771",
  api_secret: "R0h8IvRaz6UMpoxb5_iR0jUmtDQ"
});

// Save Image
const saveImage = async (file, folder = "assets") => {
  const result = await cloudinary.uploader.upload(file.path, {
    resource_type: "auto",
    folder,
  });

  fs.unlinkSync(file.path); // Delete the local temp file after upload
  return { public_id: result.public_id };  // Ensure public_id is returned in the response
};


// Delete Image
const deleteImage = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "auto",
  });
  return result;
};

// Update Image
const updateImage = async (publicId, file, folder = "assets") => {
  // Delete the old image
  await deleteImage(publicId);
  // Upload the new image
  return await saveImage(file, folder);
};

// Generate download URL
const downloadImage = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
  });
};

module.exports = {
  saveImage,
  deleteImage,
  updateImage,
  downloadImage,
};
