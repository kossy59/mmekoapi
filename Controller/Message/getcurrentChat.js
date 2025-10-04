// const {connectdatabase, client} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const messagedb = require("../../Creators/message");
const userdb = require("../../Creators/userdb");
const completedb = require("../../Creators/usercomplete");
const creators = require("../../Creators/creators");

const getcurrentChat = async (req, res) => {
  const userid = req.body.creatorid; // This is the target user ID (the person we're chatting with)
  const clientid = req.body.clientid; // This is the current user ID (the person logged in)

  const mychat = req.body.mychat;


  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  if (!clientid) {
    return res.status(400).json({ ok: false, message: "client Id invalid!!" });
  }

  try {
    let chatInfo = {};

    let clientinfo = await userdb.findOne({ _id: userid }).exec();
    
    if (clientinfo) {
      let photos = await completedb
        .findOne({ useraccountId: clientinfo._id })
        .exec();
      
      let image = "";
      if (photos?.photoLink) {
        image = photos?.photoLink || "";
      }

      let username = "";
      if (clientinfo.nickname) {
        username = clientinfo.nickname;
      } else {
        username = `${clientinfo.firstname} ${clientinfo.lastname}`;
      }

      chatInfo.name = username;
      chatInfo.photolink = image;
      chatInfo.value = "client";
      chatInfo.id = clientinfo._id;
      chatInfo.firstname = clientinfo.firstname;
      
    } else {
      return res.status(404).json({ ok: false, message: "Target user not found" });
    }

    // console.log("this is chatinfo "+chatInfo)
    //    let Chats = await data.databar.listDocuments(data.dataid,data.msgCol,[sdk.Query.limit(200), sdk.Query.and([
    //     sdk.Query.or([sdk.Query.equal("toid",[userid]), sdk.Query.equal("toid",[clientid])]),
    //     sdk.Query.or([sdk.Query.equal("fromid",[userid]), sdk.Query.equal("fromid",[clientid])])
    //    ])])

    
    // OPTIMIZED: Use MongoDB query to directly fetch messages between users
    // This is much faster than fetching all messages and filtering
    let Chats = await messagedb.find({
      $or: [
        { toid: userid, fromid: clientid },
        { fromid: userid, toid: clientid }
      ]
    })
    .sort({ date: -1 }) // Sort by date descending (newest first)
    .limit(30) // Limit to 30 messages directly in the query
    .exec();


    if (!Chats[0]) {
      return res
        .status(200)
        .json({ ok: true, message: `user host empty`, chats: [], chatInfo });
    }

    // Mark unread messages as read (batch update for better performance)
    let unviewing = Chats.filter((value) => {
      return value.notify === true && String(value.toid) === String(clientid);
    });


    if (unviewing.length > 0) {
      // OPTIMIZED: Batch update instead of individual saves
      await messagedb.updateMany(
        { 
          _id: { $in: unviewing.map(msg => msg._id) },
          notify: true,
          toid: clientid
        },
        { $set: { notify: false } }
      );
    }

    // OPTIMIZED: Get all unique sender IDs to fetch user info in batch
    let senderIds = [...new Set(Chats.map(msg => msg.fromid))];

    // OPTIMIZED: Batch fetch all user info and photos
    let [allUsers, allPhotos] = await Promise.all([
      userdb.find({ _id: { $in: senderIds } }).exec(),
      completedb.find({ useraccountId: { $in: senderIds } }).exec()
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


    // OPTIMIZED: Process messages with cached data
    let Listchat = Chats.map((message) => {
      let senderInfo = userMap[message.fromid];
      let senderPhoto = photoMap[message.fromid];
      
      if (senderInfo) {
        const isVip = senderInfo.isVip || false;
        const vipEndDate = senderInfo.vipEndDate;
        const isVipActive = isVip && vipEndDate && new Date(vipEndDate) > new Date();
        
        
        return {
          id: message.fromid,
          content: message.content,
          date: message.date,
          name: senderInfo.firstname,
          photolink: senderPhoto?.photoLink || "",
          client: message.client,
          coin: message.coin || false,
          files: message.files || [],
          fileCount: message.fileCount || 0,
          isVip: senderInfo.isVip || false,
          vipStartDate: senderInfo.vipStartDate,
          vipEndDate: senderInfo.vipEndDate
        };
      }
      return null;
    }).filter(Boolean); // Remove null entries

    // Sort messages chronologically (oldest first for display)
    let allchat = Listchat.sort((a, b) => {
      return Number(a.date) - Number(b.date);
    });
    
    
    return res.status(200).json({
      ok: true,
      message: `Chat fetched successfully`,
      chats: allchat,
      chatInfo,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getcurrentChat;
