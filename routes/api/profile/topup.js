const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/profile/topup');

router.route('/')
.post(Editprofile)


module.exports = router;