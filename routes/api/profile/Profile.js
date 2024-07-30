const express = require('express')
const router = express.Router();
const getprofile = require('../../../Controller/profile/getprofile');

router.route('/')
.post(getprofile)


module.exports = router;