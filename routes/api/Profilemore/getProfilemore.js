const express = require('express')
const router = express.Router();
const getprofile = require('../../../Controller/Profilemore/getMoreprofile');

router.route('/')
.post(getprofile)


module.exports = router;