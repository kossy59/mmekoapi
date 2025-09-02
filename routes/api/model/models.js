const express = require('express')
const router = express.Router();
const createmodel = require('../../../Controller/Model/newmodel');
const getmymodel = require('../../../Controller/Model/getmymodel')
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
.put(upload.any(),/** handleRefresh ,*/ createmodel)
.post(getmymodel)


module.exports = router;
