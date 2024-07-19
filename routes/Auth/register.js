const express = require('express')
const router = express.Router();
const newUsers = require('../../Controller/Auth/registering');

router.route('/')
.post(newUsers)

module.exports = router;