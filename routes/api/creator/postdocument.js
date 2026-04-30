const express = require('express')
const router = express.Router();
const postdoc = require('../../../Controller/Creator/postdocument');
const postFanDocument = require('../../../Controller/Creator/postFanDocument');
const multer = require('multer')

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
  .put(upload.any(), postdoc)

router.route('/fan')
  .put(upload.any(), postFanDocument)

module.exports = router;