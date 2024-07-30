const express = require('express')
const router = express.Router();
const readsharePost = require('../../../Controller/Share/getSharepost');


router.route('/')
.get(readsharePost)

module.exports = router;