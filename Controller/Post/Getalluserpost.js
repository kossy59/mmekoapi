// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const postdb = require("../../Models/post");

const readPost = async (req, res) => {
  const userid = req.body.userid;

  //let data = await connectdatabase()

  try {
    let du = await postdb.find({ userid: userid }).exec();

    if (!du) {
      return res
        .status(409)
        .json({ ok: false, message: "current user can not edit this post!!" });
    }
    return res.status(200).json({ ok: true, message: `All Post`, post: du });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readPost;
