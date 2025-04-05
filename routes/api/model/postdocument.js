const express = require('express')
const router = express.Router();
const postdoc = require('../../../Controller/Model/postdocument');
router.route('/')
.put(postdoc)


module.exports = router;