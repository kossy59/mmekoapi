const bookingdb = require("../../Models/book");
const modeldb = require("../../Models/models");
const photoLink = require("../../Models/usercomplete");
const userdb = require("../../Models/userdb");
const admindb = require("../../Models/admindb");

const createLike = async (req, res) => {
  const userid = req.body.userid;
  const modelid = req.body.modelid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

  //let data = await connectdatabase()

  try {
    const users = await bookingdb.find({ userid: userid }).exec();
    const adminmessage = await admindb.find({ userid: userid }).exec();

    let model = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let mod = await bookingdb
      .find({
        modelid: modelid,
      })
      .exec();
    mod = mod.filter((u) => {
      const created = new Date(u.createdAt);
      return created >= thirtyDaysAgo && created <= now;
    });
    model = [...mod];
    console.log("model", model);

    let user = users.filter((value) => {
      return (
        String(value.status) === "accepted" ||
        String(value.status) === "decline" ||
        String(value.status) === "pending"
      );
    });

    //console.log('under user pending')

    let approve = [];

    for (let i = 0; i < model.length; i++) {
      console.log("inside my model");
      let username = await userdb.findOne({ _id: model[i].userid }).exec();
      let image1 = await photoLink
        .findOne({ useraccountId: model[i].userid })
        .exec();
      // if (username) {
      approve.push({
        photolink: image1.photoLink,
        name: username.firstname,
        status: model[i].status,
        type: model[i].type,
        date: model[i].date,
        time: model[i].time,
        modelid: model[i].modelid,
        id: model[i]._id,
        place: model[i].place,
        clientid: model[i].userid,
      });
      // }
    }

    for (let i = 0; i < user.length; i++) {
      let image = await modeldb.findOne({ _id: user[i].modelid }).exec();

      if (image) {
        let photo = image.photolink.split(",");

        approve.push({
          photolink: photo[0],
          name: image.name,
          status: user[i].status,
          type: user[i].type,
          date: user[i].date,
          time: user[i].time,
          modelid: user[i].modelid,
          id: user[i]._id,
          modeluserid: image.userid,
          amount: image.price,
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
        };

        approve.push(data);
      }
    });

    if (!approve[0]) {
      return res.status(200).json({
        ok: false,
        message: "you have 0 approved request!!",
        approve: [],
      });
    }
    approve = [...approve, ...model.reverse()];
    return res.status(200).json({ ok: true, message: ` Success`, approve });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
