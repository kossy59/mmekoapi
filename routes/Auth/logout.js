const express = require('express')
const router = express.Router();
const newUsers = require('../../Controller/Auth/logouts');

router.route('/')
.get(newUsers)

module.exports = router;