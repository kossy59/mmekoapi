const express = require('express')
const router = express.Router();
const editUser = require('../../../Controller/Admin/edituser');

router.route('/')
.post(editUser)

module.exports = router;
