const express = require('express');
const multer = require('multer');
const fs = require('fs');
const {
  saveImage,
  deleteImage,
  updateImage,
  downloadImage
} = require('../utils/cloudinary'); // Adjust path as needed

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/image/save
 * Upload and save a new image to Cloudinary
 */
export const saveImage = async (image, bucket = 'default_folder') => {
  try {
    console.log("Uploading image to Cloudinary...");

    // Create a FormData object to send the image and folder info
    const formData = new FormData();
    formData.append('image', image);  // This must match `upload.single('image')` in the backend
    formData.append('upload_preset', 'post_file'); // Cloudinary preset (optional if uploading directly to Cloudinary)
    formData.append('bucket', bucket); // Cloudinary folder (bucket)

    // Make the POST request to upload the image
    const response = await axios.post('https://mmeko.com/api/image/save', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("Image :", response.data);
    console.log("Image uploaded successfully:", response.data);
    return response.data.public_id; // Cloudinary public ID returned after upload
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};


/**
 * GET /api/image/download
 * Get Cloudinary URL for an image
 * Query: photoLink, bucket
 */
router.get('/download', async (req, res) => {
  try {
    const { photoLink, bucket } = req.query;

    const url = downloadImage(photoLink, bucket);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/image/delete
 * Delete an image from Cloudinary
 * Body: { photoLink, bucket }
 */
router.delete('/delete', async (req, res) => {
  try {
    const { photoLink, bucket } = req.body;

    await deleteImage(photoLink, bucket);
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/image/update
 * Replace an existing image in Cloudinary
 * FormData: photoLink, bucket, image (file)
 */
router.put('/update', upload.single('image'), async (req, res) => {
  try {
    const { photoLink, bucket } = req.body;
    const file = req.file;

    const id = await updateImage(photoLink, bucket, file);
    fs.unlinkSync(file.path); // remove uploaded file

    res.json({ public_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
