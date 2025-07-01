const getlike = require("../../helpers/likes_in_days");
const getCoin = require("../../helpers/get_user_coin");
const getUSD = require("../../helpers/get_user_usd");
const getEarning = require("../../helpers/earning_in_days");
const getRequest = require("../../helpers/get_request_history");
const getGift = require("../../helpers/gift_in_days");
const userdb = require("../../Models/userdb");
let modeldb = require("../../Models/models");
const readHistory = async (req, res) => {
  const userid = req.body.userid;
  const modelid = req.body.modelid;

  if (!userid) {
    return res.status(409).json({ ok: false, message: "No user ID!!" });
  }
  const model = await userdb.find({
    modelId: modelid,
  });
  let currentModel = await modeldb.find({
    userid: userid,
  });

  console.log("inside history");

  try {
    let gift_count = "---";
    let request_count = "---";
    let earning = "---";
    console.log("inside getlike");
    let like_count = await getlike(userid);
    console.log("inside coin");
    let coin = await getCoin(userid);
    let usd = 0;

    console.log("ontop usd assgn");
    if (!coin || coin > 0) {
      usd = getUSD(coin);
    } else {
      coin = 0;
    }

    console.log("after usd assgn");

    let like_count2 = "";

    like_count2 = String(like_count);

    if (like_count <= 0) {
      like_count2 = "---";
    }

    console.log("inside history log");
    console.log("inside gift");
    gift_count = String(await getGift(userid));
    console.log("inside request");
    request_count = String(await getRequest(modelid));
    console.log("inside earning");
    earning = String(await getEarning(userid));

    if (parseFloat(gift_count) <= 0) {
      gift_count = "---";
    }

    if (parseFloat(earning) <= 0) {
      earning = "---";
    }

    if (parseFloat(request_count) <= 0) {
      request_count = "---";
    }

    let history = {
      gift: gift_count,
      request: request_count,
      earning: earning,
      like: like_count2,
      coin: String(currentModel[0].earnings),
      usd: String(currentModel[0].earnings * 0.05),
    };

    for (let data in history) {
      console.log(history[data]);
    }

    console.log("returning profile" + history);
    return res.status(200).json({ ok: true, message: `All Post`, history });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readHistory;
