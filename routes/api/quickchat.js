const express = require('express');
const router = express.Router();
const getRecentChats = require('../../Controller/QuickChat/getRecentChats');
const getConversations = require('../../Controller/QuickChat/getConversations');
const verifyJwtBody = require('../../Middleware/verifyBody');

// Get last 3 messages for a specific conversation
router.post('/recent', verifyJwtBody, getRecentChats);

// Get all conversations with last message info
router.post('/conversations', verifyJwtBody, getConversations);

module.exports = router;
