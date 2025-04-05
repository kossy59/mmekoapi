const express = require('express')
const router = express.Router();
const like = require('../../../Controller/Like/Newlike');

router.route('/')
.put(like)


module.exports = router;