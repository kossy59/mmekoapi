const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const completedb = require("../../Creators/usercomplete");
const admindb = require("../../Creators/admindb");
const creatordb = require("../../Creators/creators");

const createLike = async (req, res) => {
  const userid = req.body.userid;

  // console.log("notificationsss1")

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  // console.log("notificationsss2")

  //let data = await connectdatabase()

  let creator_listing = await creatordb.findOne({ userid: userid }).exec();
  let users = [];
  if (creator_listing) {
    console.log("this is creator");
    users = await bookingdb.find({ creatorid: creator_listing._id }).exec();
    console.log("this is creator not " + users.length);
  }

  const adminmessage = await admindb.find({ userid: userid }).exec();

  let creator_list = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter creator array for bookings created within the last 30 days
  users = users.filter((m) => {
    const created = new Date(m.createdAt);
    return created >= thirtyDaysAgo && created <= now;
  });
  let user = users.filter((value) => {
    return (
      value.status === "pending" ||
      value.status === "accepted" ||
      value.status === "decline"
    );
  });

  let listinfos = [];

  // console.log("notificationsss")

  let creatorast = 0;
  let adminlast = 0;
  let admintext = "";
  let creatormessage = "";

  for (let i = 0; i < user.length; i++) {
    const client = await userdb.findOne({ _id: user[i].userid }).exec();
    const clientphoto = await completedb
      .findOne({ useraccountId: user[i].userid })
      .exec();

    if (creatorast < user[i]._id.getTimestamp().getTime()) {
      creatorast = user[i]._id.getTimestamp().getTime();
      creatormessage = `creator notification from ${client.firstname}`;
    }

    creator_list.push({
      name: client.firstname,
      type: user[i].type,
      date: user[i].date,
      time: user[i].time,
      photolink: clientphoto?.photoLink || "",
      clientid: client._id,
      place: user[i].place,
      creatorid: user[i].creatorid,
      status: user[i].status,
      ismessage: false,
      notification: false,
    });
  }

  adminmessage.forEach((value) => {
    if (value.seen) {
      if (adminlast < value._id.getTimestamp().getTime()) {
        adminlast = value._id.getTimestamp().getTime();
        admintext = value.message;
      }

      let data = {
        message: value.message,
        time: `${value._id.getTimestamp().getTime()}`,
        ismessage: true,
        id: value._id,
        admindb: true,
        notification: false,
      };

      listinfos.push(data);
    }
  });

  let lastmessage = "";

  if (creatorast > adminlast) {
    lastmessage = creatormessage;
  } else if (adminlast > creatorast) {
    lastmessage = admintext;
  }

  // console.log("notification length "+listinfos.length)
  return res.status(200).json({
    ok: true,
    message: ` Success`,
    data: { creator: creator_list, notify: listinfos, lastmessage: lastmessage },
  });

  //    catch(err){
  //        return res.status(500).json({"ok":false,'message': `${err.message}!`});
  //    }
};

module.exports = createLike;
