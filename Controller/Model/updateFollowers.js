const userdb = require("../../Models/userdb");
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

  if (!userToFollow) {
    return res.status(404).json({
      ok: false,
      message: `Model not found`,
    });
  }
  let isFollowing;

  try {
    let currentFollowers = userToFollow[0].followers;
    isFollowing = currentFollowers.includes(userId);
    if (action === "update") {
      if (!isFollowing) {
        currentFollowers.push(userId);
        try {
          (userToFollow[0].followers = currentFollowers),
            await userToFollow[0].save();

          isFollowing = true;
          console.log("Added follower successfully");
        } catch (error) {
          return res.status(500).json({
            ok: false,
            message: `${error.message}!`,
          });
        }
      } else {
        currentFollowers = currentFollowers.filter((id) => id !== userId);
        try {
          (userToFollow[0].followers = currentFollowers),
            await userToFollow[0].save();
          console.log("Unfollowed successfully");

          isFollowing = false;
        } catch (error) {
          return res.status(500).json({
            ok: false,
            message: `${error.message}!`,
          });
        }
      }
    }

    return res.status(200).json({ isFollowing });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = updateView;
