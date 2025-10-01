const express = require('express');
const router = express.Router();
const { blockUser, unblockUser, getBlockedUsers, isUserBlocked } = require('../../../Controller/BlockUser/blockUser');
const verifyJwtBody = require('../../../Middleware/verifyBody');

// Route to block a user
router.route('/block')
  .post(verifyJwtBody, blockUser);

// Route to unblock a user
router.route('/unblock')
  .post(verifyJwtBody, unblockUser);

// Route to get all users blocked by a specific user
router.route('/blocked-users')
  .post(verifyJwtBody, getBlockedUsers);

// Route to check if a user is blocked
router.route('/is-blocked')
  .post(verifyJwtBody, isUserBlocked);

module.exports = router;