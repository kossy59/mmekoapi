const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/Admin/adminnotify');

router.route('/')
.post(Editprofile)


module.exports = router;