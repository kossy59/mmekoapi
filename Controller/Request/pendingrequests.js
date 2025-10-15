const bookingdb = require("../../Creators/book");
const creatordb = require("../../Creators/creators");

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

    // Filter creator array for bookings created within the last 30 days
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
      const creator_portfolio_id = await creatordb.findOne({ _id: user[i].creator_portfolio_id }).exec();
      let image = creator_portfolio_id?.creatorfiles[0]?.creatorfilelink || "";
      if (creator_portfolio_id)
        listinfos.push({
          name: creator_portfolio_id?.name,
          type: user[i].type,
          date: user[i].date,
          time: user[i].time,
          photolink: image,
          creator_portfolio_id: creator_portfolio_id._id,
          id: user[i]._id,
        });
    }

    // console.log("modeil "+creatorinfo)

    return res
      .status(200)
      .json({ ok: true, message: ` Success`, info: listinfos });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
