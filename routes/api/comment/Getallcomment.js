const express = require('express')
const router = express.Router();
const getallcomment = require('../../../Controller/Comment/Getcomment');


router.route('/')
.put(getallcomment)

module.exports = router;