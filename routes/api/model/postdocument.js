const express = require('express')
const router = express.Router();
const postdoc = require('../../../Controller/Model/postdocument');
const multer = require('multer')

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
.put(upload.any(), postdoc)


module.exports = router;
