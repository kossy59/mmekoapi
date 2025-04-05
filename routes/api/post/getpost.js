const express = require('express')
const router = express.Router();
const readPost = require('../../../Controller/Post/Getpost');


router.route('/')
.post(readPost)

module.exports = router;