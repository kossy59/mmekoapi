// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const postdb = require("../../Creators/post");

const readPost = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res
      .status(400)
      .json({ ok: false, message: "Missing required parameter: userid" });
  }

  console.log(`[getalluserPost] Fetching posts for user: ${userid}`);

  try {
    let du = await postdb.find({ userid: userid }).exec();

    // If du is null or undefined, return an empty array instead of error
    if (!du) {
      du = [];
    }

    console.log(`[getalluserPost] Found ${du.length} posts for user: ${userid}`);
    
    return res.status(200).json({ 
      ok: true, 
      message: `Posts for user ${userid}`, 
      post: du 
    });
  } catch (err) {
    console.error(`[getalluserPost] Error: ${err.message}`);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readPost;
