const express = require('express');
const router = express.Router();
const { 
  blockUser, 
  unblockUser, 
  getBlockedUsers, 
  isUserBlocked, 
  getUsersWhoBlockedMe 
} = require('../../../Controller/BlockUser/blockUser');
const verifyJwt = require('../../../Middleware/verify');
const verifyJwtBody = require('../../../Middleware/verifyBody');

// Block a user
router.route('/block')
  .post(verifyJwtBody, blockUser);

// Unblock a user  
router.route('/unblock')
  .post(verifyJwtBody, unblockUser);

// Get list of blocked users
router.route('/blocked-users')
  .post(verifyJwtBody, getBlockedUsers);

// Check if user is blocked
router.route('/is-blocked')
  .post(verifyJwtBody, isUserBlocked);

// Get users who have blocked the current user
router.route('/blocked-by')
  .post(verifyJwtBody, getUsersWhoBlockedMe);

module.exports = router;
