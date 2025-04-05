const express = require('express')
const router = express.Router();
const getalluserPost = require('../../../Controller/Share/GetalluserShaerdpost');


router.route('/')
.get(getalluserPost)

module.exports = router;