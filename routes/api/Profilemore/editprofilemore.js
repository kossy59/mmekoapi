const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/Profilemore/editProfilemore');
const multer = require('multer')
// const handleRefresh = require('../../../Middleware/refresh')
// const verifyJwt = require('../../../Middleware/verify');

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Removed authentication middleware to match other profile controllers
 * This allows profile updates without JWT authentication
 */
router.route('/')
.post(upload.single('updatePhoto'), Editprofile)


module.exports = router;