const exclusivePostPurchasedb = require("../../Creators/exclusivePostPurchase");
const exclusivePostdata = require("../../Creators/exclusivePost");
const userdb = require("../../Creators/userdb");

const getPurchasedExclusivePosts = async (req, res) => {
  try {
    const { userid } = req.body;

    if (!userid) {
      return res.status(400).json({ ok: false, message: "User ID is required" });
    }

    // Get all purchases for this user
    const purchases = await exclusivePostPurchasedb.find({ userid: userid }).sort({ purchasedAt: -1 });

    // Get the actual posts
    const postIds = purchases.map((p) => p.postid);
    const posts = await exclusivePostdata.find({ _id: { $in: postIds } });

    // Enrich posts with user data
    const postsWithUser = await Promise.all(
      posts.map(async (post) => {
        const user = await userdb.findById(post.userid);
        return {
          ...post.toObject(),
          user: user
            ? {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                photolink: user.photolink,
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      ok: true,
      message: "Purchased exclusive content retrieved successfully",
      posts: postsWithUser,
    });
  } catch (err) {
    console.error("Error getting purchased exclusive posts:", err);
    return res.status(500).json({ ok: false, message: err.message || "Internal error" });
  }
};

module.exports = getPurchasedExclusivePosts;

