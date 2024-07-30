const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/profile/editprofile');

router.route('/')
.post(Editprofile)


module.exports = router;