const followerdb = require("../../Creators/followers");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const photodb = require("../../Creators/usercomplete");
const { filterBlockedUsers } = require("../../utiils/blockFilter");

const getUserFollowers = async (req, res) => {
  const { userid } = req.body;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "User ID is required" });
  }

  try {
    let follows = {
      followers: [],
      following: [],
    };
    
    // Get followers from the followers collection (source of truth)
    let followersFromDB = await followerdb.find({ userid: userid }).exec();
    let followers = followersFromDB.map(f => f.followerid);
    
    if (followers?.length) {
      for (let i = 0; i < followers.length; i++) {
        let canmessage = false;
        let creator_portfolio_id = "";
        let photolink = "";
        let username = await userdb.findOne({ _id: followers[i] }).exec();
        let creator = await creatordb.findOne({ userid: followers[i] }).exec();

        if (username) {
          let photo = await photodb
            .findOne({ useraccountId: followers[i] })
            .exec();
          if (creator) {
            canmessage = true;
            creator_portfolio_id = creator._id;
          }

          if (photo) {
            photolink = photo?.photoLink || "";
          }

          const isVip = username.isVip || false;
          const vipEndDate = username.vipEndDate;
          const isVipActive = isVip && vipEndDate && new Date(vipEndDate) > new Date();
          
          let user = {
            name: `${username.firstname} ${username.lastname}`,
            image: photolink,
            canmessage: canmessage,
            creator_portfolio_id: creator_portfolio_id,
            id: username._id,
            following: false,
            isVip: username.isVip || false,
            vipStartDate: username.vipStartDate,
            vipEndDate: username.vipEndDate,
            email: username.email,
            gender: username.gender,
            country: username.country,
            creator_verified: username.creator_verified || false,
            balance: username.balance || "0",
            earnings: username.earnings || 0,
            createdAt: username.createdAt,
          };

          follows.followers.push(user);
        }
      }
    }

    // Get following from the followers collection (source of truth)
    let followingFromDB = await followerdb.find({ followerid: userid }).exec();
    let followings = followingFromDB.map(f => f.userid);
    
    if (followings?.length) {
      for (let i = 0; i < followings.length; i++) {
        let canmessage = false;
        let creator_portfolio_id = "";
        let photolink = "";
        let username = await userdb.findOne({ _id: followings[i] }).exec();
        let creator = await creatordb.findOne({ userid: followings[i] }).exec();

        if (username) {
          let photo = await photodb
            .findOne({ useraccountId: followings[i] })
            .exec();
          if (creator) {
            canmessage = true;
            creator_portfolio_id = creator._id;
          }

          if (photo) {
            photolink = photo?.photoLink || "";
          }

          const isVip = username.isVip || false;
          const vipEndDate = username.vipEndDate;
          const isVipActive = isVip && vipEndDate && new Date(vipEndDate) > new Date();
          
          let user = {
            name: `${username.firstname} ${username.lastname}`,
            image: photolink,
            canmessage: canmessage,
            creator_portfolio_id: creator_portfolio_id,
            id: username._id,
            following: true,
            isVip: username.isVip || false,
            vipStartDate: username.vipStartDate,
            vipEndDate: username.vipEndDate,
            email: username.email,
            gender: username.gender,
            country: username.country,
            creator_verified: username.creator_verified || false,
            balance: username.balance || "0",
            earnings: username.earnings || 0,
            createdAt: username.createdAt,
          };

          follows.following.push(user);
        }
      }
    }

    // Filter out blocked users from both followers and following lists
    const filteredFollowers = await filterBlockedUsers(follows.followers, userid);
    const filteredFollowing = await filterBlockedUsers(follows.following, userid);
    
    const filteredFollows = {
      followers: filteredFollowers,
      following: filteredFollowing,
    };

    return res
      .status(200)
      .json({ 
        ok: true, 
        message: `Fetched followers and following successfully`, 
        data: filteredFollows 
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getUserFollowers;
