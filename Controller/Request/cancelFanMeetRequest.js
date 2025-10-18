const requestdb = require("../../Creators/requsts");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
const { pushmessage } = require("../../utiils/sendPushnot");

const cancelFanRequest = async (req, res) => {
  const {
    requestId,
    userid
  } = req.body;

  if (!requestId || !userid) {
    return res.status(400).json({
      ok: false,
      message: "Missing required parameters"
    });
  }

  try {
    // Find the request
    const request = await requestdb.findOne({ 
      _id: requestId,
      userid: userid,
      status: "request"
    }).exec();

    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "request request not found or already processed"
      });
    }

    // Update request status to cancelled
    request.status = "cancelled";
    await request.save();

    // Get host type for dynamic messages
    const hostType = request.type || "Fan meet";

    // Refund the user - move money from pending back to balance
    const user = await userdb.findOne({ _id: userid }).exec();
    if (user) {
      let userBalance = parseFloat(user.balance) || 0;
      let userPending = parseFloat(user.pending) || 0;
      let refundAmount = parseFloat(request.price);

      user.balance = String(userBalance + refundAmount);
      user.pending = String(userPending - refundAmount);
      await user.save();

      // Create refund history
      const refundHistory = {
        userid,
        details: `${hostType} request cancelled - refund processed`,
        spent: "0",
        income: `${refundAmount}`,
        date: `${Date.now().toString()}`
      };
      await historydb.create(refundHistory);
    }

    // Send notifications
    await sendEmail(userid, `Your ${hostType.toLowerCase()} request has been cancelled`);
    await pushmessage(userid, `Your ${hostType.toLowerCase()} request has been cancelled`, "/bell.jpg");
    
    // Create database notification for fan
    await admindb.create({
      userid: userid,
      message: `Your ${hostType.toLowerCase()} request has been cancelled`,
      seen: false
    });
    
    await sendEmail(request.creator_portfolio_id, `A fan cancelled their ${hostType.toLowerCase()} request`);
    await pushmessage(request.creator_portfolio_id, `A fan cancelled their ${hostType.toLowerCase()} request`, "/bell.jpg");
    
    // Create database notification for creator
    await admindb.create({
      userid: request.creator_portfolio_id,
      message: `A fan cancelled their ${hostType.toLowerCase()} request`,
      seen: false
    });

    return res.status(200).json({
      ok: true,
      message: `${hostType} request cancelled successfully`
    });

  } catch (err) {
    console.error("Error cancelling fan meet request:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = cancelFanRequest;
