const userdb = require("../../Creators/userdb");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
const { pushmessage } = require("../../utiils/sendPushnot");

const updateView = async (req, res) => {
  const { id, userId, action } = req.body;

  if (!id || !userId) {
    return res.status(409).json({
      ok: false,
      message: `Id and UserId is required`,
    });
  }
  const userToFollow = await userdb
    .find({
      _id: id,
    })
    .exec();
  const userFollowing = await userdb
    .find({
      _id: userId,
    })
    .exec();

  if (!userToFollow) {
    return res.status(404).json({
      ok: false,
      message: `Creator not found`,
    });
  }
  let isFollowing;

  try {
    let currentFollowers = userToFollow[0].followers;
    let currentFollowing = userFollowing[0]?.following || [];
    isFollowing = currentFollowers.includes(userId);
    if (action === "update") {
      if (!isFollowing) {
        currentFollowers.push(userId);
        try {
          userToFollow[0].followers = currentFollowers;
          await userToFollow[0].save();

          currentFollowing.push(id);
          userFollowing[0].following = currentFollowing;
          await userFollowing[0].save();
          console.log(userFollowing[0]?.following);

          isFollowing = true;

          let respond = {
            userid: id,
            message: `${userFollowing[0].firstname} ${userFollowing[0].lastname} followed you`,
            seen: false,
          };

          await admindb.create(respond);

          await sendEmail(id, "you have new follower");
          await pushmessage(id, "you have new follower", "creatoricon");

          console.log("Added follower successfully");
        } catch (error) {
          console.log(error);
          return res.status(500).json({
            ok: false,
            message: `${error.message}!`,
          });
        }
      } else {
        currentFollowers = currentFollowers.filter((id) => id !== userId);
        try {
          userToFollow[0].followers = currentFollowers;
          await userToFollow[0].save();
          currentFollowing = currentFollowing.filter((item) => item !== id);

          userFollowing[0].following = currentFollowing;
          await userFollowing[0].save();
          console.log(userFollowing[0]?.following);
          console.log("Unfollowed successfully");
          let respond = {
            userid: id,
            message: `${userFollowing[0].firstname} ${userFollowing[0].lastname} unfollowed you`,
            seen: false,
          };

          await admindb.create(respond);

          await sendEmail(id, "A user unfollowed you");
          await pushmessage(id, "A user unfollowed you", "creatoricon");

          isFollowing = false;
        } catch (error) {
          console.log(error);
          return res.status(500).json({
            ok: false,
            message: `${error.message}!`,
          });
        }
      }
    }

    return res.status(200).json({ isFollowing });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = updateView;
