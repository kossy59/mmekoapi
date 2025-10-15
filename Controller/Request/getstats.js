const requestdb = require("../../Creators/requsts");
const creatordb = require("../../Creators/creators");

const createLike = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

  //let data = await connectdatabase()

  try {
    let users = await requestdb.find({ userid: userid }).exec();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter creator array for requests created within the last 30 days
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
