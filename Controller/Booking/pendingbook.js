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
      return String(value.status) === "pending";
    });

    if (!user[0]) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!", info: [] });
    }

    let listinfos = [];

    for (let i = 0; i < user.length; i++) {
      const modelid = await modeldb.findOne({ _id: user[i].modelid }).exec();
      let image = modelid?.modelfiles[0]?.modelfilelink || "";
      if (modelid)
        listinfos.push({
          name: modelid?.name,
          type: user[i].type,
          date: user[i].date,
          time: user[i].time,
          photolink: image,
          modelid: modelid._id,
          id: user[i]._id,
        });
    }

    // console.log("modeil "+modelinfo)

    return res
      .status(200)
      .json({ ok: true, message: ` Success`, info: listinfos });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
