const followerdb = require("../../Models/followers");
const userdb = require("../../Models/userdb");
const admindb = require("../../Models/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");

const createModel = async (req, res) => {
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
      seen: true,
    };

    await admindb.create(respond);

    await followerdb.deleteOne({ _id: Isfollowed._id });
    await sendEmail(userid, "user unfollow you");
    await sendpushnote(userid, "user unfollow you", "modelicon");

    return res.status(200).json({ ok: true, message: `unfollowed successfully` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createModel;
