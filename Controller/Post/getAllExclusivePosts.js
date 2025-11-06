const exclusivePostdb = require("../../Creators/exclusivePost");
const userdb = require("../../Creators/userdb");

const getAllExclusivePosts = async (req, res) => {
  const userid = req.body.userid || req.query.userid;

  if (!userid) {
    return res
      .status(400)
      .json({ ok: false, message: "Missing required parameter: userid" });
  }

  try {
    // Use aggregation to join exclusive posts with user information
    const posts = await exclusivePostdb.aggregate([
      { $match: { userid: userid } },
      { $sort: { posttime: -1 } }, // Sort by posttime descending (newest first)
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

    // If posts is null or undefined, return an empty array instead of error
    const result = posts || [];
    
    return res.status(200).json({ 
      ok: true, 
      message: `Exclusive posts for user ${userid}`, 
      posts: result 
    });
  } catch (err) {
    console.error("Error fetching exclusive posts:", err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getAllExclusivePosts;

