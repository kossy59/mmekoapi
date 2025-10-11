const express = require('express');
const router = express.Router();
const {
  createOrGetSupportChat,
  sendMessage,
  adminSendMessage,
  getAllSupportChats,
  getSupportChat,
  updateChatStatus,
  getUserSupportChat
} = require('../../Controller/SupportChat/supportChatController');

// User routes
router.post('/create-or-get', createOrGetSupportChat);
router.post('/send-message', sendMessage);
router.get('/user/:userid', getUserSupportChat);

// Admin routes
router.get('/admin/all', getAllSupportChats);
router.get('/admin/:chatId', getSupportChat);
router.post('/admin/send-message', adminSendMessage);
router.put('/admin/:chatId/status', updateChatStatus);

module.exports = router;
