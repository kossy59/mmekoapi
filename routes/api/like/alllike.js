const express = require('express')
const router = express.Router();
const getlike = require('../../../Controller/Like/Getlike');

router.route('/')
.get(getlike)


module.exports = router;