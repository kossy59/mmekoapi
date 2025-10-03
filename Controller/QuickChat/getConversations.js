const messagedb = require("../../Creators/message");
const userdb = require("../../Creators/userdb");
const completedb = require("../../Creators/usercomplete");
const { filterBlockedUsers } = require("../../utiils/blockFilter");

const getConversations = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "Invalid user ID" });
  }

  try {
    console.log("🚀 [QUICK_CHAT_CONVERSATIONS] Fetching conversations for user:", userid);
    
    // Get all unique conversations for this user with optimized aggregation
    let conversations = await messagedb.aggregate([
      {
        $match: {
          $or: [
            { fromid: userid },
            { toid: userid }
          ]
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$fromid", userid] },
              "$toid",
              "$fromid"
            ]
          },
          lastMessage: { $first: "$content" },
          lastMessageTime: { $first: "$date" },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$fromid", userid] },
                  { $eq: ["$read", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      },
      {
        $limit: 20 // Limit to 20 recent conversations
      }
    ]);

    console.log("📊 [QUICK_CHAT_CONVERSATIONS] Found", conversations.length, "conversations");

    if (conversations.length === 0) {
      return res.status(200).json({
        ok: true,
        conversations: [],
        count: 0
      });
    }

          // Fetch user info for each conversation
          let userIds = conversations.map(conv => conv._id);
          console.log("🔍 [QUICK_CHAT_CONVERSATIONS] Fetching user info for IDs:", userIds);
          
          let [users, photos] = await Promise.all([
            userdb.find({ _id: { $in: userIds } }).exec(),
            completedb.find({ useraccountId: { $in: userIds } }).exec()
          ]);

          console.log("👥 [QUICK_CHAT_CONVERSATIONS] Raw users data:", users.length, "users found");
          console.log("📸 [QUICK_CHAT_CONVERSATIONS] Raw photos data:", photos.length, "photos found");

          // Log each user's data
          users.forEach((user, index) => {
            console.log(`👤 [QUICK_CHAT_CONVERSATIONS] User ${index + 1}:`, {
              _id: user._id,
              firstname: user.firstname,
              lastname: user.lastname,
              nickname: user.nickname,
              email: user.email
            });
          });

          // Log each photo's data
          photos.forEach((photo, index) => {
            console.log(`📸 [QUICK_CHAT_CONVERSATIONS] Photo ${index + 1}:`, {
              useraccountId: photo.useraccountId,
              photoLink: photo.photoLink,
              photoLinkType: typeof photo.photoLink,
              photoLinkLength: photo.photoLink?.length,
              isDataImage: photo.photoLink?.startsWith('data:image'),
              isUrl: photo.photoLink?.startsWith('http'),
              isEmpty: !photo.photoLink || photo.photoLink.trim() === "",
              // Show all photo fields
              allPhotoFields: Object.keys(photo),
              fullPhotoObject: photo,
              // Check for alternative photo fields
              photoID: photo.photoID,
              hasPhotoID: !!photo.photoID,
              // Check if photoLink is null/undefined vs empty string
              isNull: photo.photoLink === null,
              isUndefined: photo.photoLink === undefined,
              isString: typeof photo.photoLink === 'string'
            });
          });

          let userMap = {};
          let photoMap = {};
          users.forEach(user => { userMap[user._id] = user; });
          photos.forEach(photo => { photoMap[photo.useraccountId] = photo; });

          console.log("👥 [QUICK_CHAT_CONVERSATIONS] Fetched info for", Object.keys(userMap).length, "users");
          console.log("📸 [QUICK_CHAT_CONVERSATIONS] Photo map keys:", Object.keys(photoMap));
          
          // Debug: Let's also check what's actually in the database for these users
          console.log("🔍 [QUICK_CHAT_CONVERSATIONS] Debugging database content for users:", userIds);
          for (let userId of userIds) {
            let debugPhoto = await completedb.findOne({ useraccountId: userId }).exec();
            console.log(`🔍 [QUICK_CHAT_CONVERSATIONS] Debug photo for user ${userId}:`, {
              exists: !!debugPhoto,
              useraccountId: debugPhoto?.useraccountId,
              photoLink: debugPhoto?.photoLink,
              photoID: debugPhoto?.photoID,
              allFields: debugPhoto ? Object.keys(debugPhoto) : [],
              fullObject: debugPhoto
            });
          }

          // Format conversations
          let formattedConversations = conversations.map((conv, index) => {
            let user = userMap[conv._id];
            let photo = photoMap[conv._id];
            
            const formattedConv = {
              fromid: conv._id,
              toid: userid,
              content: conv.lastMessage,
              date: conv.lastMessageTime,
              name: user?.nickname || `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || 'Unknown User',
              firstname: user?.firstname,
              lastname: user?.lastname,
              photolink: photo?.photoLink || "",
              messagecount: conv.unreadCount,
              lastMessage: conv.lastMessage,
              lastMessageTime: conv.lastMessageTime
            };
            
            console.log(`📝 [QUICK_CHAT_CONVERSATIONS] Formatted conversation ${index + 1}:`, {
              fromid: formattedConv.fromid,
              name: formattedConv.name,
              photolink: formattedConv.photolink,
              photolinkType: typeof formattedConv.photolink,
              photolinkLength: formattedConv.photolink?.length,
              isDataImage: formattedConv.photolink?.startsWith('data:image'),
              isUrl: formattedConv.photolink?.startsWith('http'),
              isEmpty: !formattedConv.photolink || formattedConv.photolink.trim() === "",
              hasUser: !!user,
              hasPhoto: !!photo,
              userData: user ? { firstname: user.firstname, lastname: user.lastname, nickname: user.nickname } : null,
              photoData: photo ? { photoLink: photo.photoLink, useraccountId: photo.useraccountId } : null
            });
            
            return formattedConv;
          });

          // Filter out conversations with blocked users
          const filteredConversations = await filterBlockedUsers(formattedConversations, userid);

          console.log("✅ [QUICK_CHAT_CONVERSATIONS] Returning", filteredConversations.length, "filtered conversations");
          console.log("📤 [QUICK_CHAT_CONVERSATIONS] Final response data:", {
            ok: true,
            conversationsCount: filteredConversations.length,
            conversations: filteredConversations.map(conv => ({
              fromid: conv.fromid,
              name: conv.name,
              photolink: conv.photolink,
              photolinkType: typeof conv.photolink,
              photolinkLength: conv.photolink?.length,
              isDataImage: conv.photolink?.startsWith('data:image'),
              isUrl: conv.photolink?.startsWith('http'),
              isEmpty: !conv.photolink || conv.photolink.trim() === ""
            })),
            count: filteredConversations.length
          });

          return res.status(200).json({
            ok: true,
            conversations: filteredConversations,
            count: filteredConversations.length
          });
  } catch (error) {
    console.error("❌ [QUICK_CHAT_CONVERSATIONS] Error:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

module.exports = getConversations;
