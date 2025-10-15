const videocalldb = require("../../Creators/videoalldb");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const { Check_caller, deletebyClient, deletebyCallerid, check_connected } = require("../../utiils/check_caller");

// Start a video call
const startVideoCall = async (req, res) => {
  const { callerId, callerName, answererId, answererName, bookingId } = req.body;

  if (!callerId || !answererId) {
    return res.status(400).json({
      ok: false,
      message: "Caller ID and Answerer ID are required"
    });
  }

  try {
    // Check if answerer is available
    const answerer = await userdb.findOne({ _id: answererId }).exec();
    if (!answerer) {
      return res.status(404).json({
        ok: false,
        message: "Answerer not found"
      });
    }

    // Check if caller is available
    const caller = await userdb.findOne({ _id: callerId }).exec();
    if (!caller) {
      return res.status(404).json({
        ok: false,
        message: "Caller not found"
      });
    }

    // Check if answerer is already in a call
    const existingCall = await videocalldb.findOne({ 
      $or: [
        { callerid: answererId },
        { clientid: answererId }
      ]
    }).exec();

    if (existingCall) {
      return res.status(409).json({
        ok: false,
        message: "User is already in a call"
      });
    }

    // Create call record
    const callData = {
      callerid: answererId,
      clientid: callerId,
      connected: false,
      waiting: "wait",
      bookingId: bookingId || null,
      callerName: callerName,
      answererName: answererName,
      createdAt: new Date()
    };

    const call = await videocalldb.create(callData);

    // Get socket.io instance
    const io = req.app.get('io');
    
    // Emit call notification to answerer
    io.to(`user_${answererId}`).emit('fan_call_incoming', {
      callId: call._id,
      callerId: callerId,
      callerName: callerName,
      callerPhoto: caller.photolink,
      isIncoming: true
    });

    return res.status(200).json({
      ok: true,
      message: "Call initiated successfully",
      callId: call._id,
      data: call
    });

  } catch (err) {
    console.error("Error starting video call:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

// Accept a video call
const acceptVideoCall = async (req, res) => {
  const { callId, callerId, answererId } = req.body;

  if (!callId || !callerId || !answererId) {
    return res.status(400).json({
      ok: false,
      message: "Call ID, Caller ID and Answerer ID are required"
    });
  }

  try {
    // Find the call
    const call = await videocalldb.findOne({ _id: callId }).exec();
    if (!call) {
      return res.status(404).json({
        ok: false,
        message: "Call not found"
      });
    }

    // Update call status
    call.connected = true;
    call.waiting = "connected";
    await call.save();

    // Get socket.io instance
    const io = req.app.get('io');
    
    // Emit call accepted to caller
    io.to(`user_${callerId}`).emit('fan_call_accepted', {
      callId: callId,
      callerId: callerId,
      answererId: answererId
    });

    return res.status(200).json({
      ok: true,
      message: "Call accepted successfully",
      data: call
    });

  } catch (err) {
    console.error("Error accepting video call:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

// Decline a video call
const declineVideoCall = async (req, res) => {
  const { callId, callerId, answererId } = req.body;

  if (!callId || !callerId || !answererId) {
    return res.status(400).json({
      ok: false,
      message: "Call ID, Caller ID and Answerer ID are required"
    });
  }

  try {
    // Find and delete the call
    const call = await videocalldb.findOne({ _id: callId }).exec();
    if (!call) {
      return res.status(404).json({
        ok: false,
        message: "Call not found"
      });
    }

    // Delete call record
    await videocalldb.deleteOne({ _id: callId }).exec();

    // Get socket.io instance
    const io = req.app.get('io');
    
    // Emit call declined to caller
    io.to(`user_${callerId}`).emit('fan_call_declined', {
      callId: callId,
      callerId: callerId,
      answererId: answererId
    });

    return res.status(200).json({
      ok: true,
      message: "Call declined successfully"
    });

  } catch (err) {
    console.error("Error declining video call:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

// End a video call
const endVideoCall = async (req, res) => {
  const { callId, callerId, userId } = req.body;

  if (!callId || !userId) {
    return res.status(400).json({
      ok: false,
      message: "Call ID and User ID are required"
    });
  }

  try {
    // Find the call
    const call = await videocalldb.findOne({ _id: callId }).exec();
    if (!call) {
      return res.status(404).json({
        ok: false,
        message: "Call not found"
      });
    }

    // Determine the other participant
    const otherUserId = call.callerid === userId ? call.clientid : call.callerid;

    // Delete call record
    await videocalldb.deleteOne({ _id: callId }).exec();

    // Get socket.io instance
    const io = req.app.get('io');
    
    // Emit call ended to both participants
    io.to(`user_${userId}`).emit('fan_call_ended', {
      callId: callId,
      endedBy: userId
    });
    
    io.to(`user_${otherUserId}`).emit('fan_call_ended', {
      callId: callId,
      endedBy: userId
    });

    return res.status(200).json({
      ok: true,
      message: "Call ended successfully"
    });

  } catch (err) {
    console.error("Error ending video call:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

// Get active call status
const getCallStatus = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      ok: false,
      message: "User ID is required"
    });
  }

  try {
    // Find active call for user
    const call = await videocalldb.findOne({
      $or: [
        { callerid: userId },
        { clientid: userId }
      ]
    }).exec();

    if (!call) {
      return res.status(200).json({
        ok: true,
        hasActiveCall: false,
        message: "No active call found"
      });
    }

    return res.status(200).json({
      ok: true,
      hasActiveCall: true,
      call: call
    });

  } catch (err) {
    console.error("Error getting call status:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = {
  startVideoCall,
  acceptVideoCall,
  declineVideoCall,
  endVideoCall,
  getCallStatus
};
