// let deleteaccount = require("../../utiils/Deletes/deleteaccount")

// let deleteAcc = async(req, res)=>{
//     let userid = req.body.userid

//     if(!userid){
//         return res.status(400).json({"ok":false,'message': 'Invalid exclusive ID!!'})
//     }

//     await deleteaccount(userid)

//     return res.status(200).json({"ok":true,'message': 'Account Delete Success'})


// }

// module.exports = deleteAcc;
const userdb = require("../../Creators/userdb");
const deleteaccount = require("../../utiils/Deletes/deleteaccount");
const creators = require("../../Creators/creators");
const exclusivedb = require("../../Creators/exclusivedb");
const exclusivepurchase = require("../../Creators/exclusivePurshase");
const deleteImage = require("../../utiils/deleteImage");

const deleteAcc = async (req, res) => {
  const userid = req.body.userid;
  const token = req.headers.authorization?.replace('Bearer ', '');

  console.log("🗑️ [deleteAcc] Request received:", { userid, hasToken: !!token });

  if (!userid) {
    return res.status(400).json({
      "ok": false,
      'message': 'User ID invalid!!'
    });
  }

  // Optional: Verify token if your auth middleware isn't handling it
  if (!token) {
    return res.status(401).json({
      "ok": false,
      'message': 'Authorization token required'
    });
  }

  try {
    // Find user
    let user = await userdb.findOne({ _id: userid }).exec();

    if (!user) {
      return res.status(404).json({
        "ok": false,
        'message': 'User not found!!'
      });
    }

    console.log("👤 [deleteAcc] User found:", {
      userid,
      isCreator: user.creator_portfolio
    });

    // Check if user is a creator and delete portfolio
    if (user.creator_portfolio) {
      console.log('🎨 [deleteAcc] Deleting creator portfolio...');

      // Get creator data
      const creatorData = await creators.findOne({ userid: userid }).exec();

      if (creatorData) {
        // Delete creator images
        if (creatorData.photolink) {
          try {
            const images = creatorData.photolink.split(",");
            console.log(`📸 [deleteAcc] Deleting ${images.length} creator images`);
            for (let i = 0; i < images.length; i++) {
              await deleteImage("post", images[i]);
            }
          } catch (err) {
            console.log("⚠️ [deleteAcc] Failed deleting creator images:", err);
          }
        }

        // Delete all exclusive content
        const exclusiveContent = await exclusivedb.find({ userid: userid }).exec();
        console.log(`🎬 [deleteAcc] Deleting ${exclusiveContent.length} exclusive content items`);

        for (let i = 0; i < exclusiveContent.length; i++) {
          const content = exclusiveContent[i];

          // Delete thumbnail
          if (content.thumblink) {
            try {
              await deleteImage("post", content.thumblink);
            } catch (err) {
              console.log("⚠️ [deleteAcc] Failed deleting exclusive thumbnail:", err);
            }
          }

          // Delete content
          if (content.contentlink) {
            try {
              await deleteImage("content", content.contentlink);
              await deleteImage("post", content.contentlink);
            } catch (err) {
              console.log("⚠️ [deleteAcc] Failed deleting exclusive content:", err);
            }
          }
        }

        // Delete exclusive content records
        await exclusivedb.deleteMany({ userid: userid }).exec();

        // Delete exclusive purchases
        await exclusivepurchase.deleteMany({ userid: userid }).exec();

        // Delete creator record
        await creators.deleteOne({ userid: userid }).exec();

        console.log('✅ [deleteAcc] Creator portfolio deleted successfully');
      }
    }

    // Delete all other user data (posts, comments, likes, etc.)
    console.log('🧹 [deleteAcc] Deleting all user data...');
    await deleteaccount(userid);

    console.log('✅ [deleteAcc] Account deleted successfully');

    return res.status(200).json({
      "ok": true,
      "message": `Account deleted successfully${user.creator_portfolio ? ' (including creator portfolio)' : ''}`,
      "id": userid,
      "wasCreator": user.creator_portfolio || false
    });

  } catch (err) {
    console.error('❌ [deleteAcc] Error deleting user:', err);
    return res.status(500).json({
      "ok": false,
      'message': `Failed to delete account: ${err.message}`
    });
  }
};

module.exports = deleteAcc;