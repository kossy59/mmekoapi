const followerdb = require("../../Creators/followers");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const photodb = require("../../Creators/usercomplete");
const { filterBlockedUsers } = require("../../utiils/blockingUtils");

const createCreator = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  try {
    let follows = {
      followers: [],
      following: [],
    };
    
    // Get followers from the followers collection (source of truth)
    let followersFromDB = await followerdb.find({ userid: userid }).exec();
    let followers = followersFromDB.map(f => f.followerid);
    
    console.log("Getting followers from followers collection:", followers.length);
    if (followers?.length) {
      // console.log("got the follower")
      for (let i = 0; i < followers.length; i++) {
        let canmessage = false;
        let creatorid = "";
        let photolink = "";
        let username = await userdb.findOne({ _id: followers[i] }).exec();
        let creator = await creatordb.findOne({ userid: followers[i] }).exec();

        if (username) {
          let photo = await photodb
            .findOne({ useraccountId: followers[i] })
            .exec();
          if (creator) {
            canmessage = true;
            creatorid = creator._id;
          }

          if (photo) {
            photolink = photo?.photoLink || "";
          }

          let user = {
            name: `${username.firstname} ${username.lastname}`,
            image: photolink,
            canmessage: canmessage,
            creatorid: creatorid,
            id: username._id,
            following: false,
          };

          follows.followers.push(user);
        }
      }
    }

    // Get following from the followers collection (source of truth)
    let followingFromDB = await followerdb.find({ followerid: userid }).exec();
    let followings = followingFromDB.map(f => f.userid);
    
    console.log("Getting following from followers collection:", followings.length);
    if (followings?.length) {
      //console.log("got the followings")

      for (let i = 0; i < followings.length; i++) {
        let canmessage = false;
        let creatorid = "";
        let photolink = "";
        let username = await userdb.findOne({ _id: followings[i] }).exec();
        let creator = await creatordb.findOne({ userid: followings[i] }).exec();

        // console.log("under following creator")
        if (username) {
          // console.log("inside there is user")
          let photo = await photodb
            .findOne({ useraccountId: followings[i] })
            .exec();
          if (creator) {
            // console.log("inside she is creator")
            canmessage = true;
            creatorid = creator._id;
          }

          if (photo) {
            // console.log("inside has photo")
            photolink = photo?.photoLink || "";
          }

          let user = {
            name: `${username.firstname} ${username.lastname}`,
            image: photolink,
            canmessage: canmessage,
            creatorid: creatorid,
            id: username._id,
            following: true,
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
      .json({ ok: true, message: `Fetched followers successfully`, data: filteredFollows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createCreator;
