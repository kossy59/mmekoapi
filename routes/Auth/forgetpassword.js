const express = require('express')
const router = express.Router();
const newUsers = require('../../controller/Auth/forgetpassword');

router.route('/')
.put(newUsers)

module.exports = router;