// OPTIMIZED VERSION - Much faster message notification fetching
const messagedb = require("../../Creators/message");
const userdb = require("../../Creators/userdb");
const completedb = require("../../Creators/usercomplete");
const { filterBlockedMessages } = require("../../utiils/blockFilter");

const MsgNotify = async (req, res) => {
  let userid = req.body.userid;

  // Validate userid parameter
  if (!userid || userid === 'undefined' || userid === 'null') {
    return res.status(400).json({
      ok: false,
      message: "User ID is required",
      error: "Missing or invalid userid parameter"
    });
  }

  // Validate userid is a valid ObjectId format
  if (typeof userid !== 'string' || userid.length !== 24) {
    return res.status(400).json({
      ok: false,
      message: "Invalid User ID format",
      error: "User ID must be a valid 24-character string"
    });
  }

  try {
    // OPTIMIZED: Single query to get all messages involving this user
    let allMessages = await messagedb.find({
      $or: [
        { fromid: userid },
        { toid: userid }
      ]
    })
      .sort({ date: -1 }) // Sort by date descending (newest first)
      .exec();

    // Filter out messages from blocked users
    allMessages = await filterBlockedMessages(allMessages, userid);


    // OPTIMIZED: Group messages by conversation (other user ID)
    let conversationMap = new Map();

    allMessages.forEach(msg => {
      const otherUserId = msg.fromid === userid ? msg.toid : msg.fromid;

      // Skip messages with invalid user IDs
      if (!otherUserId || otherUserId === 'undefined' || otherUserId === 'null' || typeof otherUserId !== 'string' || otherUserId.length !== 24) {
        return;
      }

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          latestMessage: null,
          unreadCount: 0,
          lastActivity: null
        });
      }

      const conversation = conversationMap.get(otherUserId);

      // Update latest message if this is newer
      if (!conversation.latestMessage || new Date(msg.date) > new Date(conversation.latestMessage.date)) {
        conversation.latestMessage = msg;
        conversation.lastActivity = new Date(msg.date);
      }

      // Count unread messages (messages sent to this user that are unread)
      if (msg.toid === userid && msg.notify === true) {
        conversation.unreadCount++;
      }
    });

    // OPTIMIZED: Get all unique user IDs for batch fetching
    let allUserIds = Array.from(conversationMap.keys());

    // Filter out invalid user IDs (undefined, null, empty strings)
    allUserIds = allUserIds.filter(id =>
      id &&
      id !== 'undefined' &&
      id !== 'null' &&
      typeof id === 'string' &&
      id.length === 24
    );


    // OPTIMIZED: Batch fetch all user info and photos
    let [allUsers, allPhotos] = await Promise.all([
      userdb.find({ _id: { $in: allUserIds } }).exec(),
      completedb.find({ useraccountId: { $in: allUserIds } }).exec()
    ]);

    // Create lookup maps for O(1) access
    let userMap = {};
    let photoMap = {};

    allUsers.forEach(user => {
      userMap[user._id] = user;
    });

    allPhotos.forEach(photo => {
      photoMap[photo.useraccountId] = photo;
    });


    // OPTIMIZED: Build response data efficiently
    let lastchat = [];
    let recentmsg = [];
    let Allmsg = [];

    conversationMap.forEach((conversation, otherUserId) => {
      const userInfo = userMap[otherUserId];
      const userPhoto = photoMap[otherUserId];

      if (userInfo && conversation.latestMessage) {
        const messageData = {
          id: conversation.latestMessage._id,
          content: conversation.latestMessage.content,
          date: conversation.latestMessage.date,
          fromid: conversation.latestMessage.fromid,
          toid: conversation.latestMessage.toid,
          notify: conversation.latestMessage.notify,
          coin: conversation.latestMessage.coin || false,
          files: conversation.latestMessage.files || [],
          fileCount: conversation.latestMessage.fileCount || 0,
          name: userInfo.firstname,
          username: userInfo.username, // Include username field
          photolink: userPhoto?.photoLink || "",
          unreadCount: conversation.unreadCount,
          lastActivity: conversation.lastActivity,
          isVerified: userInfo.creator_verified || false // Add verified status
        };

        // Add to appropriate arrays based on message direction
        if (conversation.latestMessage.fromid === userid) {
          // Message sent by this user
          lastchat.push(messageData);
        } else {
          // Message received by this user
          recentmsg.push(messageData);
        }

        // Add to all messages
        Allmsg.push(messageData);
      }
    });

    // Sort by last activity (most recent first)
    lastchat.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    recentmsg.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    Allmsg.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));


    return res.status(200).json({
      ok: true,
      message: "Messages fetched successfully",
      lastchat,
      recentmsg,
      Allmsg
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch messages",
      error: err.message
    });
  }
};

module.exports = MsgNotify;
