const express = require('express');
const router = express.Router();
const { streamVideo } = require('../../../Controller/Video/Stream');

// Route for streaming video by fileId (Storj key)
// GET /api/video/stream/:fileId
router.get('/stream/:fileId', streamVideo);

module.exports = router;
