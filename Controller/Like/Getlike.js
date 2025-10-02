// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const likedata = require("../../Creators/like");

const readComment = async (req, res) => {
  let data = await connectdatabase();
  //retun like base on postid

  try {
    let du = await likedata.find().exec();

    return res
      .status(200)
      .json({ ok: true, message: `all comment`, like: du.documents });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readComment;
