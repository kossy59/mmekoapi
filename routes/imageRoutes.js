const express = require('express');
const multer = require('multer');
const fs = require('fs');
const {
  saveImage,
  deleteImage,
  updateImage,
  downloadImage
} = require('../utiils/cloudinary'); // Adjust path as needed

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/image/save
 * Upload and save a new image to Cloudinary
 */
router.post('/save', upload.single('image'), async (req, res) => {
  try {
    // Get the bucket (folder) from the request body, defaulting to 'default_folder' if not provided
    const bucket = req.body.bucket || 'video';
    const file = req.file;

    // Make sure the file exists and then pass it to the saveImage function
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Call the saveImage function, passing the file and bucket/folder name
    const id = await saveImage(file, bucket);

    // Clean up local file after upload
    fs.unlinkSync(file.path);

    // Respond with the public ID of the uploaded image
    res.json({ public_id: id });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ error: err.message });
  }
});

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
