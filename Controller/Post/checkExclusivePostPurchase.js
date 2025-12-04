const exclusivePostPurchasedb = require("../../Creators/exclusivePostPurchase");

const checkExclusivePostPurchase = async (req, res) => {
  try {
    const { userid, postid, postids } = req.body;

    if (!userid) {
      return res.status(400).json({ ok: false, message: "User ID is required" });
    }

    // Handle bulk check
    if (postids && Array.isArray(postids)) {
      const purchases = await exclusivePostPurchasedb.find({
        userid: userid,
        postid: { $in: postids }
      }).select('postid');

      const purchasedPostIds = purchases.map(p => p.postid);

      return res.status(200).json({
        ok: true,
        purchasedPostIds: purchasedPostIds
      });
    }

    // Handle single check (backward compatibility)
    if (!postid) {
      return res.status(400).json({ ok: false, message: "Post ID or Post IDs are required" });
    }

    // Check if user has purchased this post
    const purchase = await exclusivePostPurchasedb.findOne({
      userid: userid,
      postid: postid,
    });

    return res.status(200).json({
      ok: true,
      purchased: !!purchase,
      purchase: purchase || null,
    });
  } catch (err) {
    console.error("Error checking exclusive post purchase:", err);
    return res.status(500).json({ ok: false, message: err.message || "Internal error" });
  }
};

module.exports = checkExclusivePostPurchase;

