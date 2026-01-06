const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for videos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define the destination path: uploads/videos
        const uploadPath = path.join(__dirname, '../../uploads/videos');

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use the original filename as requested
        // Sanitize filename to prevent directory traversal or invalid characters
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, sanitizedFilename);
    }
});

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for videos
    },
    fileFilter: (req, file, cb) => {
        // Accept only video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// POST /api/upload-video
router.post('/', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        // Construct the public URL
        // Since 'uploads' is static served at '/uploads', 'uploads/videos' will be at '/uploads/videos'
        const publicUrl = `/uploads/videos/${req.file.filename}`;

        res.json({
            message: 'Video uploaded successfully',
            url: publicUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

module.exports = router;
