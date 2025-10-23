// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const likedata = require("../../Creators/like");
const postdbs = require("../../Creators/post");
const admindb = require("../../Creators/admindb");
const userdb = require("../../Creators/userdb");
let sendEmail = require("../../utiils/sendEmailnot");
const { pushmessage } = require("../../utiils/sendPushnot");
const createLike = async (req, res) => {
  console.log("🔥 [BACKEND] LIKE CONTROLLER TRIGGERED");
  console.log("📊 [BACKEND] Request body:", req.body);
  console.log("📊 [BACKEND] Request headers:", req.headers);
  console.log("📊 [BACKEND] Request method:", req.method);
  console.log("📊 [BACKEND] Request URL:", req.url);
  
  const userid = req.body.userid;
  let sharedid = req.body.sharedid;
  const postid = req.body.postid;
  
  console.log("🔍 [BACKEND] Extracted data:", { userid, sharedid, postid });
  console.log("🔍 [BACKEND] Data validation:", {
    hasUserid: !!userid,
    hasPostid: !!postid,
    useridType: typeof userid,
    postidType: typeof postid
  });

  if (!userid && !postid) {
    console.error("❌ [BACKEND] Validation failed - missing userid or postid");
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");
  //let data = await connectdatabase()

  try {
    console.log("🚀 [BACKEND] Starting database operations...");
    
    // Check for existing like
    console.log("🔍 [BACKEND] Checking for existing like...");
    let du = likedata.find({ userid: userid }).exec();
    let du1 = (await du).find((value) => value.postid === postid);
    console.log("🔍 [BACKEND] Existing like check result:", {
      foundExistingLike: !!du1,
      existingLikeId: du1?._id,
      existingLikeData: du1
    });
    
    // Get post user
    console.log("🔍 [BACKEND] Fetching post user...");
    let postuser = await postdbs.findOne({ _id: postid }).exec();
    console.log("🔍 [BACKEND] Post user result:", {
      foundPost: !!postuser,
      postUserId: postuser?.userid,
      fullPostData: postuser
    });

  
    if (du1) {
      console.log("🔄 [BACKEND] UNLIKE OPERATION - Removing existing like...");
      await likedata.deleteOne({ _id: du1._id });
      console.log("✅ [BACKEND] Like removed from database");
      
      if (postuser && postuser.userid) {
        console.log("📧 [BACKEND] Sending unlike notifications...");
        await sendEmail(postuser.userid, "user unlike your Post");
        await pushmessage(
          postuser.userid,
          "user unlike your Post",
          "creatoricon"
        );
        
        // Create database notification for unlike
        const liker = await userdb.findOne({ _id: userid }).exec();
        if (liker) {
          await admindb.create({
            userid: postuser.userid,
            message: `${liker.firstname} ${liker.lastname} unliked your post`,
            seen: false
          });
        }
        console.log("✅ [BACKEND] Unlike notifications sent");
      } else {
        console.log("⚠️ [BACKEND] Skipping unlike notifications - no post user ID found");
      }
      
      // After unlike, return updated likeCount and likedBy
      console.log("🔍 [BACKEND] Fetching updated like count...");
      const likes = await likedata.find({ postid });
      const likeCount = likes.length;
      const likedBy = likes.map(like => like.userid);
      
      console.log("✅ [BACKEND] UNLIKE SUCCESS:", {
        postid,
        likeCount,
        likedBy,
        message: "Unlike successful"
      });
    
      return res
        .status(200)
        .json({ ok: true, message: "ulike post success!!", likeCount, likedBy });
    }

    if (!sharedid) {
      sharedid = "";
    }

    console.log("🔄 [BACKEND] LIKE OPERATION - Creating new like...");
    let like = {
      userid,
      sharedid,
      postid,
    };
    
    console.log("📝 [BACKEND] Like data to create:", like);

    //data.databar.createDocument(data.dataid,data.likeCol,sdk.ID.unique(),like)
    await likedata.create(like);
    console.log("✅ [BACKEND] Like created in database");
    
    if (postuser && postuser.userid) {
      console.log("📧 [BACKEND] Sending like notifications...");
      await sendEmail(postuser.userid, "user like your Post");
      await pushmessage(postuser.userid, "user like your Post", "/icons/m-logo.png");
      
      // Create database notification for like
      const liker = await userdb.findOne({ _id: userid }).exec();
      if (liker) {
        await admindb.create({
          userid: postuser.userid,
          message: `${liker.firstname} ${liker.lastname} liked your post`,
          seen: false
        });
      }
      console.log("✅ [BACKEND] Like notifications sent");
    } else {
      console.log("⚠️ [BACKEND] Skipping notifications - no post user ID found");
    }
    
    // After like, return updated likeCount and likedBy
    console.log("🔍 [BACKEND] Fetching updated like count...");
    const likes = await likedata.find({ postid });
    const likeCount = likes.length;
    const likedBy = likes.map(like => like.userid);
    
    console.log("✅ [BACKEND] LIKE SUCCESS:", {
      postid,
      likeCount,
      likedBy,
      message: "Like successful"
    });
    
    return res.status(200).json({ ok: true, message: `like post Success`, likeCount, likedBy });
  } catch (err) {
    console.error("❌ [BACKEND] LIKE CONTROLLER ERROR:", err);
    console.error("❌ [BACKEND] Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      userid,
      postid
    });
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
