const express = require('express');
const router = express.Router();
const { pushmessage } = require('../../../utiils/sendPushnot');
const verifyJwt = require('../../../Middleware/verify');

// Test push notification endpoint (with optional auth for testing)
router.post('/send-test', async (req, res) => {
  try {
    const { userid, message, title, type, icon, url } = req.body;

    if (!userid || !message) {
      return res.status(400).json({
        ok: false,
        message: 'User ID and message are required'
      });
    }

    // Optional: Check if user is authenticated (for production)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.log('⚠️ Test push notification sent without authentication (testing mode)');
    }

    // Send push notification
    await pushmessage(userid, message, icon || '/icons/m-logo.png', {
      title: title || 'Test Notification',
      type: type || 'test',
      url: url || '/'
    });

    res.status(200).json({
      ok: true,
      message: 'Test push notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending test push notification:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to send test push notification',
      error: error.message
    });
  }
});

module.exports = router;
