const express = require('express')
const router = express.Router();
const newUsers = require('../../Controller/Auth/completeregisters');

router.route('/')
.post(newUsers)

module.exports = router;