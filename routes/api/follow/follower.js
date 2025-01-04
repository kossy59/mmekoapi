const express = require('express')
const router = express.Router();
const unfollow = require('../../../Controller/Follower/delete_follower');
const follow = require('../../../Controller/Follower/post_follower');


router.route('/')
.post(follow)
.put(unfollow)

module.exports = router;