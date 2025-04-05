const express = require('express')
const router = express.Router();
const follow = require('../../../Controller/Follower/get_followers');

router.route('/')
.post(follow)

module.exports = router;