const exclusivePostdb = require("../../Creators/exclusivePost");
const userdb = require("../../Creators/userdb");
const mongoose = require("mongoose");

const getAllExclusivePosts = async (req, res) => {
  const userid = req.body.userid || req.query.userid;

  console.log('[getAllExclusivePosts] Request received for userid:', userid);

  if (!userid) {
    return res.status(400).json({ ok: false, message: "Missing required parameter: userid" });
  }

  try {
    // DEBUG: Check count first
    const simpleCount = await exclusivePostdb.countDocuments({ userid: userid });
    console.log(`[getAllExclusivePosts] Simple count for userid ${userid}: ${simpleCount}`);

    // If simple count is 0, maybe try ObjectId?
    if (simpleCount === 0) {
      console.log('[getAllExclusivePosts] No posts found with string userid. Checking if stored as ObjectId...');
      // Only try if it's a valid ObjectId string
      if (mongoose.Types.ObjectId.isValid(userid)) {
        // Note: Schema says String, but let's debug just in case
        // We can't easily query a String field with an ObjectId, but if the data was saved as ObjectId 
        // in a mixed schema or before schema change, this might be relevant. 
        // For now, let's stick to the schema definition which is String.
      }
    }

    console.log('[getAllExclusivePosts] Running aggregation...');
    const posts = await exclusivePostdb.aggregate([
      { $match: { userid: userid } },
      { $sort: { posttime: -1 } },
      {
        $lookup: {
          from: "userdbs",
          localField: "userid",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userid: 1,
          postfilelink: 1,
          postfilepublicid: 1,
          posttime: 1,
          content: 1,
          posttype: 1,
          price: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: 1,
            firstname: 1,
            lastname: 1,
            username: 1,
            gender: 1,
            country: 1,
            age: 1,
            followers: 1,
            following: 1,
            creator_portfolio: 1,
            creator_portfolio_id: 1,
            creator_verified: 1,
            photolink: 1,
            photoID: 1,
            isVip: 1,
            vipStartDate: 1,
            vipEndDate: 1
          },
        },
      },
    ]);

    const result = posts || [];
    console.log('[getAllExclusivePosts] Aggregation completed. Found', result.length, 'posts');

    res.status(200).json({
      ok: true,
      message: `Exclusive posts for user ${userid}`,
      posts: result
    });

  } catch (err) {
    console.error("[getAllExclusivePosts] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = getAllExclusivePosts;
