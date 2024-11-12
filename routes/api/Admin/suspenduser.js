const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/Admin/suspend_user');

router.route('/')
.post(Editprofile)


module.exports = router;