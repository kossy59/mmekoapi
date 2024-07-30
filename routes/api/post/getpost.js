const express = require('express')
const router = express.Router();
const readPost = require('../../../Controller/Post/Getpost');


router.route('/')
.get(readPost)

module.exports = router;