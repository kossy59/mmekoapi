const messagedb = require("../../Creators/message");
const userdb = require("../../Creators/userdb");
const completedb = require("../../Creators/usercomplete");

const getRecentChats = async (req, res) => {
  const userid = req.body.userid;
  const targetUserId = req.body.targetUserId;

  if (!userid || !targetUserId) {
    return res.status(400).json({ ok: false, message: "Invalid user IDs" });
  }

  try {
    console.log("🚀 [QUICK_CHAT] Fetching last 30 messages between users:", userid, "and", targetUserId);
    
    // Fetch last 30 messages between users
    let messages = await messagedb.find({
      $or: [
        { toid: targetUserId, fromid: userid },
        { fromid: targetUserId, toid: userid }
      ]
    })
    .sort({ date: -1 })
    .limit(30)
    .exec();

    console.log("📊 [QUICK_CHAT] Found", messages.length, "messages");

          // Fetch target user info
          console.log("🔍 [QUICK_CHAT] Fetching target user info for ID:", targetUserId);
          
          let [targetUser, targetPhoto] = await Promise.all([
            userdb.findOne({ _id: targetUserId }).exec(),
            completedb.findOne({ useraccountId: targetUserId }).exec()
          ]);

          console.log("👤 [QUICK_CHAT] Raw target user data:", targetUser ? {
            _id: targetUser._id,
            firstname: targetUser.firstname,
            lastname: targetUser.lastname,
            username: targetUser.username,
            email: targetUser.email
          } : "No user found");

          console.log("📸 [QUICK_CHAT] Raw target photo data:", targetPhoto ? {
            useraccountId: targetPhoto.useraccountId,
            photoLink: targetPhoto.photoLink,
            photoLinkType: typeof targetPhoto.photoLink,
            photoLinkLength: targetPhoto.photoLink?.length,
            isDataImage: targetPhoto.photoLink?.startsWith('data:image'),
            isUrl: targetPhoto.photoLink?.startsWith('http'),
            isEmpty: !targetPhoto.photoLink || targetPhoto.photoLink.trim() === "",
            // Show all photo fields
            allPhotoFields: Object.keys(targetPhoto),
            fullPhotoObject: targetPhoto,
            // Check for alternative photo fields
            photoID: targetPhoto.photoID,
            hasPhotoID: !!targetPhoto.photoID,
            // Check if photoLink is null/undefined vs empty string
            isNull: targetPhoto.photoLink === null,
            isUndefined: targetPhoto.photoLink === undefined,
            isString: typeof targetPhoto.photoLink === 'string'
          } : "No photo found");

          let chatInfo = {
            name: targetUser?.username || `${targetUser?.firstname || ''} ${targetUser?.lastname || ''}`.trim() || 'Unknown User',
            photolink: targetPhoto?.photoLink || "",
            firstname: targetUser?.firstname || "",
            lastname: targetUser?.lastname || "",
            id: targetUserId
          };

          console.log("👤 [QUICK_CHAT] Final chat info:", {
            name: chatInfo.name,
            photolink: chatInfo.photolink,
            photolinkType: typeof chatInfo.photolink,
            photolinkLength: chatInfo.photolink?.length,
            isDataImage: chatInfo.photolink?.startsWith('data:image'),
            isUrl: chatInfo.photolink?.startsWith('http'),
            isEmpty: !chatInfo.photolink || chatInfo.photolink.trim() === "",
            hasUser: !!targetUser,
            hasPhoto: !!targetPhoto
          });

    // Format messages
    let formattedMessages = messages.reverse().map(msg => {
      // Extract file IDs from Appwrite URLs
      let processedFiles = [];
      if (msg.files && Array.isArray(msg.files)) {
        processedFiles = msg.files.map(fileUrl => {
          // If it's an Appwrite URL, extract the file ID
          if (fileUrl && typeof fileUrl === 'string' && fileUrl.includes('storage/buckets/')) {
            const match = fileUrl.match(/\/files\/([^\/]+)\//);
            if (match && match[1]) {
              return match[1]; // Return just the file ID
            }
          }
          // If it's already a file ID or local URL, return as is
          return fileUrl;
        });
      }

      return {
        id: msg.fromid,
        content: msg.content,
        date: msg.date,
        coin: msg.coin || false,
        files: processedFiles,
        fileCount: msg.fileCount || 0
      };
    });

          console.log("✅ [QUICK_CHAT] Returning", formattedMessages.length, "formatted messages");
          console.log("📤 [QUICK_CHAT] Final response data:", {
            ok: true,
            messagesCount: formattedMessages.length,
            chatInfo: {
              name: chatInfo.name,
              photolink: chatInfo.photolink,
              photolinkType: typeof chatInfo.photolink,
              photolinkLength: chatInfo.photolink?.length,
              isDataImage: chatInfo.photolink?.startsWith('data:image'),
              isUrl: chatInfo.photolink?.startsWith('http'),
              isEmpty: !chatInfo.photolink || chatInfo.photolink.trim() === ""
            },
            count: formattedMessages.length
          });

          return res.status(200).json({
            ok: true,
            messages: formattedMessages,
            chatInfo,
            count: formattedMessages.length
          });
  } catch (error) {
    console.error("❌ [QUICK_CHAT] Error:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

module.exports = getRecentChats;
