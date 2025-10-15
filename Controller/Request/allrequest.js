const bookingdb = require("../../Creators/book");
const creatordb = require("../../Creators/creators");
const photoLink = require("../../Creators/usercomplete");
const userdb = require("../../Creators/userdb");
const admindb = require("../../Creators/admindb");

const createLike = async (req, res) => {
  const userid = req.body.userid;
  const creator_portfolio_id = req.body.creator_portfolio_id;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

  try {
    let users = await bookingdb.find({ userid: userid }).exec();
    let adminmessage = await admindb.find({ userid: userid }).exec();

    let creator = [];

    if (creator_portfolio_id) {
      let mod = await bookingdb.find({ creator_portfolio_id: creator_portfolio_id }).exec();
      creator = mod
        // .filter((value) => {
        //   return (
        //     String(value.status) === "pending" ||
        //     String(value.status) === "accepted"
        //   );
        // })
        .reverse();
    }

    let user = users.filter((value) => {
      return (
        String(value.status) === "accepted" ||
        String(value.status) === "decline" ||
        String(value.status) === "pending" ||
        String(value.status) === "completed"
      );
    });

    //console.log('under user pending')

    let approve = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter creator array for bookings created within the last 30 days
    creator = creator.filter((m) => {
      const created = new Date(m.createdAt);
      return created >= thirtyDaysAgo && created <= now;
    });

    adminmessage = adminmessage
      .filter((m) => {
        const created = new Date(m.createdAt);
        return created >= thirtyDaysAgo && created <= now;
      })
      .reverse();
    user = user.filter((m) => {
      const created = new Date(m.createdAt);
      return created >= thirtyDaysAgo && created <= now;
    });

    for (let i = 0; i < creator.length; i++) {
      console.log("inside my creator" + i);
      let username = await userdb.findOne({ _id: creator[i].userid }).exec();
      let image1 = await photoLink
        .findOne({ useraccountId: creator[i].userid })
        .exec();
      if (username) {
        approve.push({
          photolink: image1?.photoLink || "",
          name: username.firstname,
          status: creator[i].status,
          type: creator[i].type,
          date: creator[i].date,
          time: creator[i].time,
          creator_portfolio_id: creator[i].creator_portfolio_id,
          id: creator[i]._id,
          place: creator[i].place,
          clientid: creator[i].userid,
          createdAt: creator[i].createdAt,
          updatedAt: creator[i].updatedAt,
          creatoruserid: username.id,
        });
      }
    }

    for (let i = 0; i < user.length; i++) {
      let image = await creatordb.findOne({ _id: user[i].creator_portfolio_id }).exec();

      if (image?.photolink) {
        let photo = image.photolink.split(",");

        approve.push({
          photolink: photo[0],
          name: image.name,
          status: user[i].status,
          type: user[i].type,
          date: user[i].date,
          time: user[i].time,
          creator_portfolio_id: user[i].creator_portfolio_id,
          id: user[i]._id,
          creatoruserid: image.userid,
          amount: image.price,
          createdAt: user[i].createdAt,
          updatedAt: user[i].updatedAt,
          recUserId: user[i].id,
        });
      }
    }

    adminmessage.forEach((value) => {
      if (value.seen) {
        let data = {
          message: value.message,
          time: `${value._id.getTimestamp().getTime()}`,
          ismessage: true,
          id: value._id,
          admindb: true,
          notification: false,
          createdAt: value.createdAt,
        };

        approve.push(data);
      }
    });

    for (let i = 0; i < user.length; i++) {
      let image = await creatordb.findOne({ _id: user[i].creator_portfolio_id }).exec();
      if (image) {
        let photo = image.creatorfiles[0]?.creatorfilelink || "";

        approve.push({
          photolink: photo,
          name: image.name,
          status: user[i].status,
          type: user[i].type,
          date: user[i].date,
          time: user[i].time,
          creator_portfolio_id: user[i].creator_portfolio_id,
          accepted: "accepted",
          id: user[i]._id,
          creatoruserid: image.userid,
          amount: image.price,
          createdAt: user[i].createdAt,
          updatedAt: user[i].updatedAt,
          recUserId: user[i].id,
        });
      }
    }

    if (!approve[0]) {
      return res.status(200).json({
        ok: false,
        message: "you have 0 approved request!!",
        approve: [],
      });
    }

    approve = approve.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return res.status(200).json({ ok: true, message: ` Success`, approve });
  } catch (err) {
    console.log(err);
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
