const exclusivePostdata = require("../../Creators/exclusivePost");
const exclusivePostPurchasedb = require("../../Creators/exclusivePostPurchase");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");
const { pushActivityNotification } = require("../../utiils/sendPushnot");

const purchaseExclusivePost = async (req, res) => {
  try {
    const { userid, postid } = req.body;

    if (!userid || !postid) {
      return res.status(400).json({ ok: false, message: "User ID and Post ID are required" });
    }

    // Get the exclusive post
    const post = await exclusivePostdata.findById(postid);
    if (!post) {
      return res.status(404).json({ ok: false, message: "Exclusive post not found" });
    }

    // Check if user already purchased this post
    const existingPurchase = await exclusivePostPurchasedb.findOne({
      userid: userid,
      postid: postid,
    });

    if (existingPurchase) {
      return res.status(400).json({ ok: false, message: "You have already purchased this post" });
    }

    // Get user balance
    const user = await userdb.findById(userid);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // Check both balance fields - prefer balance (String) over coinBalance (Number)
    // If balance is null/undefined/empty, try coinBalance
    let userBalance = 0;
    if (user.balance && user.balance !== "null" && user.balance !== "undefined" && user.balance.trim() !== "") {
      userBalance = parseFloat(user.balance) || 0;
    } else if (user.coinBalance !== null && user.coinBalance !== undefined) {
      userBalance = parseFloat(user.coinBalance) || 0;
    }
    
    const postPrice = parseFloat(post.price) || 0;

    // Check if user has sufficient balance
    if (userBalance < postPrice) {
      return res.status(400).json({
        ok: false,
        message: "Insufficient balance",
        required: postPrice,
        current: userBalance,
      });
    }

    // Deduct from user balance
    const newBalance = userBalance - postPrice;
    // Update both balance fields to keep them in sync
    user.balance = String(newBalance);
    user.coinBalance = newBalance;
    await user.save();

    // Add to creator's earnings
    const creator = await userdb.findById(post.userid);
    if (creator) {
      const creatorEarnings = parseFloat(creator.earnings) || 0;
      creator.earnings = String(creatorEarnings + postPrice);
      await creator.save();
    }

    // Create purchase record
    const purchase = await exclusivePostPurchasedb.create({
      userid: userid,
      postid: postid,
      creator_userid: post.userid,
      price: postPrice,
      purchasedAt: Date.now().toString(),
    });

    // Create transaction history for buyer
    const buyerHistory = {
      userid: userid,
      details: `Purchased exclusive post for ${postPrice} Gold`,
      spent: `${postPrice}`,
      income: "0",
      date: `${Date.now().toString()}`
    };
    await historydb.create(buyerHistory);

    // Create transaction history for creator - use post.userid (like completeFanRequests uses creator_portfolio_id)
    if (creator) {
      const creatorHistory = {
        userid: post.userid, // Use post.userid for transaction history (like completeFanRequests uses creator_portfolio_id)
        details: `Received ${postPrice} Golds from exclusive post sale`,
        spent: "0",
        income: `${postPrice}`,
        date: `${Date.now().toString()}`
      };
      await historydb.create(creatorHistory);

      // Create notification for creator - use creator._id (actual user ID) like completeFanRequests
      if (creator._id) {
        const creatorNotification = {
          userid: creator._id, // Use the actual creator's user ID for notifications (like completeFanRequests)
          message: `Someone purchased your exclusive post for ${postPrice} Golds`,
          seen: false,
        };
        await admindb.create(creatorNotification);

        // Send push notification to creator - use creator._id (actual user ID)
        try {
          await pushActivityNotification(
            creator._id, // Use the actual creator's user ID for push notifications
            `Someone purchased your exclusive post for ${postPrice} Golds`,
            "exclusive_post_purchased"
          );
        } catch (pushError) {
          console.error("Failed to send push notification:", pushError);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Post purchased successfully",
      purchase: purchase,
      newBalance: newBalance,
    });
  } catch (err) {
    console.error("Error purchasing exclusive post:", err);
    return res.status(500).json({ ok: false, message: err.message || "Internal error" });
  }
};

module.exports = purchaseExclusivePost;

