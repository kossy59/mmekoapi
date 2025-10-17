// OPTIMIZED VERSION - Much faster message notification fetching
const messagedb = require("../../Creators/message");
const userdb = require("../../Creators/userdb");
const completedb = require("../../Creators/usercomplete");
const { filterBlockedMessages } = require("../../utiils/blockFilter");

const MsgNotify = async (req, res) => {
  const userid = req.body.userid;

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
    // OPTIMIZED: Direct query for unread messages only
    let unreadMessages = await messagedb.find({ 
      toid: userid, 
      notify: true 
    })
    .sort({ date: -1 }) // Sort by date descending (newest first)
    .exec();

    // Filter out messages from blocked users
    unreadMessages = await filterBlockedMessages(unreadMessages, userid);


    if (unreadMessages.length === 0) {
      return res.status(200).json({ 
        ok: true, 
        message: "No unread messages", 
        notify: [] 
      });
    }

    // OPTIMIZED: Get unique sender IDs for batch fetching
    let senderIds = [...new Set(unreadMessages.map(msg => msg.fromid))];
    
    // Filter out invalid sender IDs (undefined, null, empty strings)
    senderIds = senderIds.filter(id => 
      id && 
      id !== 'undefined' && 
      id !== 'null' && 
      typeof id === 'string' && 
      id.length === 24
    );
    

    // OPTIMIZED: Batch fetch all sender info and photos
    let [allSenders, allPhotos] = await Promise.all([
      userdb.find({ _id: { $in: senderIds } }).exec(),
      completedb.find({ useraccountId: { $in: senderIds } }).exec()
    ]);

    // Create lookup maps for O(1) access
    let senderMap = {};
    let photoMap = {};
    
    allSenders.forEach(sender => {
      senderMap[sender._id] = sender;
    });
    
    allPhotos.forEach(photo => {
      photoMap[photo.useraccountId] = photo;
    });


    // OPTIMIZED: Group notifications by sender
    let notificationMap = new Map();
    
    unreadMessages.forEach(msg => {
      const senderId = msg.fromid;
      
      if (!notificationMap.has(senderId)) {
        notificationMap.set(senderId, {
          sender: senderMap[senderId],
          photo: photoMap[senderId],
          messages: [],
          unreadCount: 0
        });
      }
      
      const notification = notificationMap.get(senderId);
      notification.messages.push(msg);
      notification.unreadCount++;
    });

    // OPTIMIZED: Build response data
    let notify = [];
    
    notificationMap.forEach((notification, senderId) => {
      if (notification.sender) {
        // Get the most recent message from this sender
        const latestMessage = notification.messages.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )[0];
        
        notify.push({
          id: latestMessage._id,
          content: latestMessage.content,
          date: latestMessage.date,
          fromid: latestMessage.fromid,
          toid: latestMessage.toid,
          notify: latestMessage.notify,
          coin: latestMessage.coin || false,
          files: latestMessage.files || [],
          fileCount: latestMessage.fileCount || 0,
          name: notification.sender.firstname,
          nickname: notification.sender.nickname, // Include nickname field
          photolink: notification.photo?.photoLink || "",
          unreadCount: notification.unreadCount
        });
      }
    });

    // Sort by most recent message
    notify.sort((a, b) => new Date(b.date) - new Date(a.date));


    return res.status(200).json({
      ok: true,
      message: "Notifications fetched successfully",
      notify
    });

  } catch (err) {
    console.error("❌ [GETNOTIFY] Error:", err);
    return res.status(500).json({ 
      ok: false, 
      message: "Failed to fetch notifications",
      error: err.message 
    });
  }
};

module.exports = MsgNotify;
