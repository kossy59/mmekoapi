const express = require('express');
const router = express.Router();
const { 
  pushmessage, 
  pushActivityNotification, 
  pushMessageNotification, 
  pushSupportNotification, 
  pushAdminNotification 
} = require('../../utiils/sendPushnot');

// Test push notification endpoint
router.post('/send-test', async (req, res) => {
  try {
    const { userid, message, title, type, icon, url } = req.body;

    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Send push notification
    await pushmessage(
      userid,
      message || 'Test notification from Mmeko',
      '/icons/m-logo.png',
      {
        title: title || 'Test Notification',
        type: type || 'test',
        url: url || '/',
        icon: '/icons/m-logo.png'
      }
    );

    res.json({
      success: true,
      message: 'Test push notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending test push notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test push notification',
      details: error.message
    });
  }
});

// Test activity notification
router.post('/send-activity', async (req, res) => {
  try {
    const { userid, message } = req.body;

    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    await pushActivityNotification(userid, message || 'You have new activity!');

    res.json({
      success: true,
      message: 'Activity notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending activity notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send activity notification',
      details: error.message
    });
  }
});

// Test message notification
router.post('/send-message', async (req, res) => {
  try {
    const { userid, message, senderName } = req.body;

    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    await pushMessageNotification(userid, message || 'You have a new message!', senderName || 'Someone');

    res.json({
      success: true,
      message: 'Message notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending message notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message notification',
      details: error.message
    });
  }
});

// Test support notification
router.post('/send-support', async (req, res) => {
  try {
    const { userid, message } = req.body;

    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    await pushSupportNotification(userid, message || 'Support team has responded!');

    res.json({
      success: true,
      message: 'Support notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending support notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send support notification',
      details: error.message
    });
  }
});

// Test admin notification
router.post('/send-admin', async (req, res) => {
  try {
    const { userid, message } = req.body;

    if (!userid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    await pushAdminNotification(userid, message || 'Important admin message!');

    res.json({
      success: true,
      message: 'Admin notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send admin notification',
      details: error.message
    });
  }
});

module.exports = router;
