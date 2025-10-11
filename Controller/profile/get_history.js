const getlike = require("../../helpers/likes_in_days");
const getCoin = require("../../helpers/get_user_coin");
const getUSD = require("../../helpers/get_user_usd");
const getEarning = require("../../helpers/earning_in_days");
const getRequest = require("../../helpers/get_request_history");
const getGift = require("../../helpers/gift_in_days");
const getMonthlyFollowers = require("../../helpers/get_monthly_followers");
const userdb = require("../../Creators/userdb");
let creatordb = require("../../Creators/creators");
const readHistory = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(409).json({ ok: false, message: "No user ID!!" });
  }
  
  // Get creator information from database
  let currentCreator = await creatordb.find({
    userid: userid,
  });
  
  // Get creator_portfolio_id from the creator record
  let creator_portfolio_id = null;
  if (currentCreator && currentCreator.length > 0) {
    creator_portfolio_id = currentCreator[0]._id;
  }
  


  try {
    let gift_count = "---";
    let request_count = "---";
    let earning = "---";
    let like_count = await getlike(userid);
    let coin = await getCoin(userid);
    let usd = 0;

    if (!coin || coin > 0) {
      usd = getUSD(coin);
    } else {
      coin = 0;
    }

    let like_count2 = "";

    like_count2 = String(like_count);

    if (like_count <= 0) {
      like_count2 = "---";
    }

    gift_count = String(await getGift(userid));
    if (creator_portfolio_id) {
      request_count = String(await getRequest(creator_portfolio_id, userid));
    } else {
      // If user is not a creator, only count fan requests
      request_count = String(await getRequest(null, userid));
    }
    earning = String(await getEarning(userid));
    let monthly_followers = await getMonthlyFollowers(userid);

    if (parseFloat(gift_count) <= 0) {
      gift_count = "---";
    }

    if (parseFloat(earning) <= 0) {
      earning = "---";
    }

    if (parseFloat(request_count) <= 0) {
      request_count = "---";
    }

    if (monthly_followers <= 0) {
      monthly_followers = "---";
    }

    // Safely read creator earnings to avoid crashes when creator document is missing
    let earningsVal = 0;
    if (currentCreator && Array.isArray(currentCreator) && currentCreator.length && typeof currentCreator[0].earnings !== "undefined") {
      earningsVal = Number(currentCreator[0].earnings) || 0;
    }

    let history = {
      gift: gift_count,
      request: request_count,
      earning: earning,
      like: like_count2,
      coin: String(earningsVal),
      usd: String(earningsVal * 0.05),
      followers: String(monthly_followers),
    };


    return res.status(200).json({ ok: true, message: `All Post`, history });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = readHistory;
