const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up Multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Save Image (upload)
const saveImage = async (image, bucket) => {
  try {
    const result = await cloudinary.uploader.upload(image.path || image, {
      folder: bucket,
      use_filename: true, // Optional: Preserve original file name
      unique_filename: false, // Optional: Do not add a unique suffix to the file name
    });
    return result.public_id;
  } catch (err) {
    console.error("Error uploading image:", err);
    throw new Error('Error uploading to Cloudinary: ' + err.message);
  }
};

// Get Image (download)
const downloadImage = (photoLink, bucket) => {
  return cloudinary.url(`${bucket}/${photoLink}`, {
    secure: true, // Use HTTPS for secure download
  });
};

// Delete Image
const deleteImage = async (photoLink, bucket) => {
  try {
    const publicId = `${bucket}/${photoLink}`;
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image with public ID: ${publicId}`);
  } catch (err) {
    console.error('Error deleting image:', err);
    throw new Error('Error deleting from Cloudinary: ' + err.message);
  }
};

// Update Image
const updateImage = async (photoLink, bucket, image) => {
  try {
    const publicId = `${bucket}/${photoLink}`;

    // Delete the old image before uploading the new one
    await cloudinary.uploader.destroy(publicId);

    // Upload the new image with the same public ID
    const result = await cloudinary.uploader.upload(image.path || image, {
      public_id: publicId,
      overwrite: true, // Overwrite the old image
    });
    return result.public_id;
  } catch (err) {
    console.error('Error updating image:', err);
    throw new Error('Error updating image on Cloudinary: ' + err.message);
  }
};

// Express routes for handling image operations
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const bucket = req.body.bucket || 'default_folder'; // Optional: Specify the folder in Cloudinary
    const file = req.file;

    // Save the image to Cloudinary
    const publicId = await saveImage(file, bucket);
    fs.unlinkSync(file.path); // Clean up the local file after upload

    res.json({ public_id: publicId }); // Respond with the public ID of the uploaded image
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delete/:photoLink', async (req, res) => {
  try {
    const { photoLink } = req.params;
    const bucket = req.query.bucket || 'default_folder'; // Optional: Specify the folder in Cloudinary

    // Delete the image from Cloudinary
    await deleteImage(photoLink, bucket);
    res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/update/:photoLink', upload.single('image'), async (req, res) => {
  try {
    const { photoLink } = req.params;
    const bucket = req.body.bucket || 'default_folder'; // Optional: Specify the folder in Cloudinary
    const file = req.file;

    // Update the image on Cloudinary
    const publicId = await updateImage(photoLink, bucket, file);
    fs.unlinkSync(file.path); // Clean up the local file after upload

    res.json({ public_id: publicId }); // Respond with the public ID of the updated image
  } catch (err) {
    console.error('Error updating image:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export the functions and routes
module.exports = {
  saveImage,
  downloadImage,
  deleteImage,
  updateImage,
  router
};
