const express = require('express')
const router = express.Router();
const newUsers = require('../../controller/Auth/changepassword');

router.route('/')
.post(newUsers)

module.exports = router;