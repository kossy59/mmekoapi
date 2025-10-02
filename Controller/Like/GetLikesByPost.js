const likedata = require("../../Creators/like");

const getLikesByPost = async (req, res) => {
  const postid = req.query.postid;

  if (!postid) {
    return res.status(400).json({ ok: false, message: "Post ID is required" });
  }

  try {
    const likes = await likedata.find({ postid }).exec();
    const likeCount = likes.length;
    const likedBy = likes.map(like => like.userid);
    
    return res.status(200).json({ 
      ok: true, 
      message: "Likes fetched successfully", 
      likeCount,
      likedBy,
      like: likes
    });
  } catch (err) {
    console.error("[GetLikesByPost] Error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = getLikesByPost;