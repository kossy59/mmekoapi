const express = require('express');
const router = express.Router();
const videoCallController = require('../../../Controller/VideoCall/videoCallController');
const verifyJwt = require('../../../Middleware/verify');

// Start a video call
router.post('/start', verifyJwt, videoCallController.startVideoCall);

// Accept a video call
router.post('/accept', verifyJwt, videoCallController.acceptVideoCall);

// Decline a video call
router.post('/decline', verifyJwt, videoCallController.declineVideoCall);

// End a video call
router.post('/end', verifyJwt, videoCallController.endVideoCall);

// Get call status
router.get('/status/:userId', verifyJwt, videoCallController.getCallStatus);

module.exports = router;
