const requestdb = require("../../Creators/requsts");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const historydb = require("../../Creators/mainbalance");
let sendEmail = require("../../utiils/sendEmailnot");
let { pushActivityNotification } = require("../../utiils/sendPushnot");

const processExpiredRequests = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

    // Find all accepted Fan Call requests that are older than 48 hours
    const expiredFanCallRequests = await requestdb.find({
      status: "accepted",
      type: "Fan Call",
      createdAt: { $lt: fortyEightHoursAgo }
    }).exec();

    // Find all accepted non-Fan Call requests that are older than 7 days
    const expiredOtherRequests = await requestdb.find({
      status: "accepted",
      type: { $ne: "Fan Call" },
      createdAt: { $lt: sevenDaysAgo }
    }).exec();

    // Combine all accepted requests that should be expired
    const expiredAcceptedRequests = [...expiredFanCallRequests, ...expiredOtherRequests];

    // Find all pending requests that have expired (existing logic)
    const expiredPendingRequests = await requestdb.find({
      status: "request",
      expiresAt: { $lt: new Date() }
    }).exec();

    const allExpiredRequests = [...expiredAcceptedRequests, ...expiredPendingRequests];
    console.log(`Processing ${allExpiredRequests.length} expired requests (${expiredFanCallRequests.length} Fan Call 48h, ${expiredOtherRequests.length} other 7d, ${expiredPendingRequests.length} pending)`);

    for (const request of allExpiredRequests) {
      try {
        // Update request status to expired
        request.status = "expired";
        await request.save();

        // Refund the user - move money from pending back to balance
        const user = await userdb.findOne({ _id: request.userid }).exec();
        if (user) {
          let userBalance = parseFloat(user.balance) || 0;
          let userPending = parseFloat(user.pending) || 0;
          let refundAmount = parseFloat(request.price);

          // Only refund if there's pending money to refund
          if (userPending >= refundAmount) {
            user.balance = String(userBalance + refundAmount);
            user.pending = String(userPending - refundAmount);
            await user.save();

            // Create refund history with dynamic host type
            const hostType = request.type || "Fan meet";
            const refundHistory = {
              userid: request.userid,
              details: `${hostType} request expired - automatic refund processed`,
              spent: "0",
              income: `${refundAmount}`,
              date: `${Date.now().toString()}`
            };
            await historydb.create(refundHistory);

            // Send notifications with dynamic host type
            await sendEmail(request.userid, `Your ${hostType.toLowerCase()} request has expired and been refunded`);
            await pushActivityNotification(request.userid, `Your ${hostType.toLowerCase()} request has expired and been refunded`, "request_expired");
            
            // Find creator's actual user ID and send notification
            const creatorRecord = await creatordb.findOne({ _id: request.creator_portfolio_id }).exec();
            if (creatorRecord && creatorRecord.userid) {
              await sendEmail(creatorRecord.userid, `A ${hostType.toLowerCase()} request has expired`);
              await pushActivityNotification(creatorRecord.userid, `A ${hostType.toLowerCase()} request has expired`, "request_expired");
            }
          }
        }
      } catch (err) {
        console.error(`Error processing expired request ${request._id}:`, err);
      }
    }

    return res.status(200).json({
      ok: true,
      message: `Processed ${allExpiredRequests.length} expired requests`
    });

  } catch (err) {
    console.error("Error processing expired requests:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = processExpiredRequests;
