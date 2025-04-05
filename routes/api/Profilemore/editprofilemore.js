const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/Profilemore/editProfilemore');

router.route('/')
.post(Editprofile)


module.exports = router;