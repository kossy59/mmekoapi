const express = require('express')
const router = express.Router();
const postEclusive = require('../../../Controller/Exclusive/postExclusive');
const buy_exclusive = require('../../../Controller/Exclusive/pushasecontent');
const delete_exclusive = require('../../../Controller/Exclusive/deleteExclusive');
const multer = require('multer')
const handleRefresh = require('../../../Middleware/refresh')

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
.put(upload.any(), handleRefresh, postEclusive)
.post(buy_exclusive)
.patch(delete_exclusive)

module.exports = router;
