const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/Admin/deleteuser');

router.route('/')
.post(Editprofile)


module.exports = router;