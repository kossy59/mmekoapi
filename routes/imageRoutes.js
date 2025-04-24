const express = require('express');
const multer = require('multer');
const fs = require('fs');
const {
  saveImage,
  deleteImage,
  updateImage,
  downloadImage
} = require('../utiils/cloudinary'); // Import functions from cloudinary.js

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Set up multer to handle file uploads

// POST route to upload an image and save it to Cloudinary
router.post('/save', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;  // Access uploaded file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Log the file object to check if the file is being uploaded
    console.log("File received:", file);

    // Save image to Cloudinary and get the public_id
    const publicId = await saveImage(file);

    // Check if public_id is received
    if (!publicId) {
      return res.status(500).json({ error: 'Failed to receive public_id from Cloudinary' });
    }

    res.json({ public_id: publicId });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ error: err.message });
  }
});




// GET route to download image from Cloudinary using public_id
router.get('/download', async (req, res) => {
  try {
    const { publicId } = req.query;  // Get public_id from query params
    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required.' });
    }

    const url = downloadImage(publicId);  // Get the Cloudinary URL
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE route to delete an image from Cloudinary using public_id
router.delete('/delete', async (req, res) => {
  try {
    const { publicId } = req.body;  // Get public_id from request body
    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required.' });
    }

    await deleteImage(publicId);  // Delete the image from Cloudinary
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT route to update an image on Cloudinary (delete old and upload new)
router.put('/update', upload.single('image'), async (req, res) => {
  try {
    const { publicId } = req.body;  // Get the public_id of the image to be replaced
    const file = req.file;  // Get the new file to replace the old one
    if (!publicId || !file) {
      return res.status(400).json({ error: 'Public ID and file are required.' });
    }

    // Update the image by deleting the old and uploading the new one
    const newPublicId = await updateImage(publicId, file);

    res.json({ public_id: newPublicId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
