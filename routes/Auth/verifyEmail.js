const express = require('express')
const router = express.Router();
const newUsers = require('../../Controller/Auth/verifyEmails');

router.route('/')
.post(newUsers)

module.exports = router;