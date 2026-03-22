const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const {
    uploadRitual,
    getUserRituals,
    getArchivedRituals,
    getRitualById,
    likeRitual,
    addComment,
    getFeed,
    deleteRitual
} = require('../../Controller/creatorRitualController');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedAudio = ['audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/mp4'];

    if ([...allowedImage, ...allowedAudio].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024,   // 20MB per file
        files: 16                      // 15 panels + 1 optional audio
    }
});

const panelFields = [];
for (let i = 1; i <= 15; i++) {
    panelFields.push({ name: `panel_${i}_image`, maxCount: 1 });
}
panelFields.push({ name: 'audioFile', maxCount: 1 });

const uploadFields = upload.fields(panelFields);

const handleUpload = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ ok: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ ok: false, message: err.message });
        }
        next();
    });
};


// Feed — active rituals from all creators
router.get('/feed', getFeed);

// Upload a new ritual (multipart)
router.post('/upload', handleUpload, uploadRitual);

// Get active rituals for a specific user
router.get('/user/:userId', getUserRituals);

// Get archived rituals for a specific user (for profile page)
router.get('/archived/:userId', getArchivedRituals);

// Single ritual by ID
router.get('/:id', getRitualById);

// Like / unlike
router.post('/:id/like', likeRitual);

// Add comment
router.post('/:id/comment', addComment);

// Delete (owner only)
router.delete('/:id', deleteRitual);

module.exports = router;