let likedb = require("../Creators/like");

const likeDel = async (postid) => {
  await likedb.deleteMany({ postid: postid }).exec();
};

module.exports = likeDel;
