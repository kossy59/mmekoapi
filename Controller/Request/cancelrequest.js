const requestdb = require("../../Creators/requsts");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const historydb = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
let { pushActivityNotification } = require("../../utiils/sendPushnot");

const createLike = async (req, res) => {
  const creator_portfolio_id = req.body.creator_portfolio_id;
  const date = req.body.date;
  const time = req.body.time;
  const userid = req.body.userid;

  if (!creator_portfolio_id) {
    return res.status(400).json({ ok: false, message: "Creator ID is missing or invalid" });
  }

  //let data = await connectdatabase()

  try {
    let requests = await requestdb.find({ userid: userid }).exec();

    if (!requests[0]) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!" });
    }

    let request = requests.find((value) => {
      return (
        (String(value.date) === String(date) &&
          String(value.time) === String(time) &&
          String(value.creator_portfolio_id) === String(creator_portfolio_id) &&
          String(value.status) === "request") ||
        String(value.status) === "decline"
      );
    });

    if (!request) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!" });
    }

    // Try to find creator by _id first, then by userid
    let creatoruser = await creatordb.findOne({ _id: creator_portfolio_id }).exec();
    if (!creatoruser) {
      creatoruser = await creatordb.findOne({ userid: creator_portfolio_id }).exec();
    }
    
            if (!creatoruser) {
              return res.status(400).json({ ok: false, message: "Creator not found" });
            }
    
    let creatorprice = parseFloat(creatoruser.price);

    // Normalize type for comparison
    const normalizedType = (request.type || "").toLowerCase().trim();
    const isPrivateShow = normalizedType === "private show";
    const isFanCall = normalizedType.includes("fan call");

    // Only refund for Fan meet and Fan date, not for Fan call or Private show
    // Fan call requests don't deduct anything, so nothing to refund
    if (!isPrivateShow && !isFanCall) {
      let clientuser = await userdb.findOne({ _id: userid }).exec();

      let clientbalance = parseFloat(clientuser.balance);
      let clientpending = parseFloat(clientuser.pending);

      if (!clientbalance) {
        clientbalance = 0;
      }
      if (!clientpending) {
        clientpending = 0;
      }

      // Move money from pending back to balance
      clientbalance = clientbalance + creatorprice;
      clientpending = clientpending - creatorprice;
      
      clientuser.balance = `${clientbalance}`;
      clientuser.pending = `${clientpending}`;
      clientuser.save();

      let creatorpaymenthistory = {
        userid: userid,
        details: "Fan meet request cancelled - refund processed",
        spent: `${0}`,
        income: `${creatorprice}`,
        date: `${Date.now().toString()}`,
      };

      await historydb.create(creatorpaymenthistory);
    }

    await requestdb.deleteOne({ _id: request._id }).exec();

    // Get host type for dynamic message
    const hostType = request.type || "Fan meet";
    
    // Send notifications to creator about cancellation
    await sendEmail(creatoruser.userid, `A fan cancelled their ${hostType.toLowerCase()} request`);
    await pushActivityNotification(creatoruser.userid, `A fan cancelled their ${hostType.toLowerCase()} request`, "request_cancelled");
    
    // Create database notification for creator
    await admindb.create({
      userid: creatoruser.userid,
      message: `A fan cancelled their ${hostType.toLowerCase()} request`,
      seen: false
    });

    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};
module.exports = createLike;
