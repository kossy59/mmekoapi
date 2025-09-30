const express = require('express')
const router = express.Router();
const postdoc = require('../../../Controller/Creator/postdocument');
const multer = require('multer')
const handleRefresh = require('../../../Middleware/refresh')

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
.put(upload.any(), handleRefresh, postdoc)


module.exports = router;
