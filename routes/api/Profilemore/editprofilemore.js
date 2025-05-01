const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/Profilemore/editProfilemore');
const multer = require('multer')
const handleRefresh = require('../../../Middleware/refresh')

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * The handleRefresh middleware is used to intersect the result of file manipulation
 * by multer which exposes the token for it
 * Without this, authorization fails!
 */
router.route('/')
.post(upload.single('updatePhoto'), handleRefresh, Editprofile)


module.exports = router;