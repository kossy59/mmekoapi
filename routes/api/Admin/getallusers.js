const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/Admin/getalluser');

router.route('/')
.post(Editprofile)


module.exports = router;