const exclusivePostPurchasedb = require("../../Creators/exclusivePostPurchase");

const checkExclusivePostPurchase = async (req, res) => {
  try {
    const { userid, postid } = req.body;

    if (!userid || !postid) {
      return res.status(400).json({ ok: false, message: "User ID and Post ID are required" });
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

