const bookingdb = require("../../Models/book");
const modeldb = require("../../Models/models");

const createLike = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

  //let data = await connectdatabase()

  try {
    let users = await bookingdb.find({ userid: userid }).exec();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter model array for bookings created within the last 30 days
    users = users.filter((m) => {
      const created = new Date(m.createdAt);
      return created >= thirtyDaysAgo && created <= now;
    });

    let user = users.filter((value) => {
      return (
        String(value.status) === "accepted" ||
        String(value.status) === "decline" ||
        String(value.status) === "completed"
      );
    });

    //console.log('under user pending')

    if (!user[0]) {
      return res.status(200).json({
        ok: false,
        message: "you have 0 approved request!!",
        approve: [],
      });
    }

    let approve = [];

    for (let i = 0; i < user.length; i++) {
      let image = await modeldb.findOne({ _id: user[i].modelid }).exec();
      if (image) {
        let photo = image.modelfiles[0]?.modelfilelink || "";

        approve.push({
          photolink: photo,
          name: image.name,
          status: user[i].status,
          type: user[i].type,
          date: user[i].date,
          time: user[i].time,
          modelid: user[i].modelid,
          accepted: "accepted",
          id: user[i]._id,
          modeluserid: image.userid,
          amount: image.price,
        });
      }
    }
    return res.status(200).json({ ok: true, message: ` Success`, approve });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
