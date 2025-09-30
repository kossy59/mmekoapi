// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const likedata = require("../../Models/like");
const postdbs = require("../../Models/post");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");
const createLike = async (req, res) => {
  const userid = req.body.userid;
  let sharedid = req.body.sharedid;
  const postid = req.body.postid;
  console.log("[BACKEND] Received like request:", { userid, sharedid, postid });

  if (!userid && !postid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");
  //let data = await connectdatabase()

  try {
    console.log("untop like db");
    // let  dupplicate = await data.databar.listDocuments(data.dataid,data.likeCol)

    // console.log('untop like db')
    // let du = dupplicate.documents.find(value=>{

    //     return value.uesrid === uesrid  && value.postid === postid
    //    })

    let du = likedata.find({ userid: userid }).exec();
    let du1 = (await du).find((value) => value.postid === postid);
    let postuser = postdbs.findOne({ _id: postid }).exec();

  
    if (du1) {
      await likedata.deleteOne({ _id: du1._id });
      if (postuser) {
        await sendEmail(postuser.userid, "user unlike your Post");
        await sendpushnote(
          postuser.userid,
          "user unlike your Post",
          "modelicon"
        );
      }
      // After unlike, return updated likeCount and likedBy
      const likes = await likedata.find({ postid });
      const likeCount = likes.length;
      const likedBy = likes.map(like => like.userid);
    
      return res
        .status(200)
        .json({ ok: true, message: "ulike post success!!", likeCount, likedBy });
    }

    if (!sharedid) {
      sharedid = "";
    }

  

    let like = {
      userid,
      sharedid,
      postid,
    };


    //data.databar.createDocument(data.dataid,data.likeCol,sdk.ID.unique(),like)
    await likedata.create(like);
    if (postuser) {
      await sendEmail(postuser.userid, "user like your Post");
      await sendpushnote(postuser.userid, "user like your Post", "modelicon");
    }
    // After like, return updated likeCount and likedBy
  const likes = await likedata.find({ postid });
  const likeCount = likes.length;
  const likedBy = likes.map(like => like.userid);
  console.log(`[LIKE] PostID: ${postid}, LikeCount: ${likeCount}, LikedBy:`, likedBy);
  return res.status(200).json({ ok: true, message: `like post Success`, likeCount, likedBy });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
