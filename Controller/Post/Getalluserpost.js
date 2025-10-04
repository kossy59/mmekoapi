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

  try {
    let du = await postdb.find({ userid: userid }).exec();

    // If du is null or undefined, return an empty array instead of error
    if (!du) {
      du = [];
    }
    
    return res.status(200).json({ 
      ok: true, 
      message: `Posts for user ${userid}`, 
      post: du 
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readPost;
