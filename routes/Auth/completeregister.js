const express = require('express')
const router = express.Router();
const newUsers = require('../../Controller/Auth/completeregisters');
const multer = require('multer')
const handleRefresh = require('../../Middleware/refresh')

/**
 * This implementation allows for in memory file upload manipulation
 * This prevents accessing the filesystem of the hosted server
 */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * The handleRefresh middleware is used to intersect the result of file manipulation
 * by multer which exposes the token for it
 * Without this, authorization fails!
 */
router.route('/')
.post(upload.single('registerFile'), handleRefresh, newUsers)

module.exports = router;