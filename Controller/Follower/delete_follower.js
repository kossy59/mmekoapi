const followerdb = require("../../Creators/followers");
const userdb = require("../../Creators/userdb");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
const { pushmessage } = require("../../utiils/sendPushnot");

const createCreator = async (req, res) => {
  const followerid = req.body.followerid;
  const userid = req.body.userid;

  if (!followerid && !userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  let followed = await followerdb.find({ userid: userid }).exec();

  let Isfollowed = followed.find((value) => value.followerid === followerid);

  if (!Isfollowed) {
    return res.status(400).json({ ok: false, message: "follow user first!!" });
  }

  try {
    let client = await userdb.findOne({ _id: followerid }).exec();

    if (!client) {
      return res
        .status(400)
        .json({ ok: false, message: "this user is not avalable!!" });
    }

    let respond = {
      userid: userid,
      message: `${client.firstname} ${client.lastname} unfollowed you`,
      seen: false,
    };

    await admindb.create(respond);

    await followerdb.deleteOne({ _id: Isfollowed._id });
    await sendEmail(userid, "user unfollow you");
    await pushmessage(userid, "user unfollow you", "creatoricon");

    // No need to sync userdb arrays - followers collection is the single source of truth

    // Emit socket event for real-time updates
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit(`follow_update_${userid}`, {
          action: 'unfollow',
          follower: followerid
        });
        io.emit('follow_update', {
          action: 'unfollow',
          target: userid,
          actor: followerid
        });
      }
    } catch (socketErr) {
      console.log("[unfollow] socket emit error:", socketErr?.message);
    }

    return res.status(200).json({ ok: true, message: `unfollowed successfully` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createCreator;
