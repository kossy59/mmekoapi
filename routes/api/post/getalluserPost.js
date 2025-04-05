const express = require('express')
const router = express.Router();
const getalluserPost = require('../../../Controller/Post/Getalluserpost');


router.route('/')
.get(getalluserPost)

module.exports = router;