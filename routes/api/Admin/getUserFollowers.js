const express = require('express')
const router = express.Router();
const getUserFollowers = require('../../../Controller/Admin/getUserFollowers');

router.route('/')
.post(getUserFollowers)

module.exports = router;
