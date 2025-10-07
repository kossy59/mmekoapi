const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");

const processExpiredRequests = async (req, res) => {
  try {
    // Find all pending requests that have expired
    const expiredRequests = await bookingdb.find({
      status: "request",
      expiresAt: { $lt: new Date() }
    }).exec();

    console.log(`Processing ${expiredRequests.length} expired requests`);

    for (const booking of expiredRequests) {
      try {
        // Update booking status to expired
        booking.status = "expired";
        await booking.save();

        // Refund the user - move money from pending back to balance
        const user = await userdb.findOne({ _id: booking.userid }).exec();
        if (user) {
          let userBalance = parseFloat(user.balance) || 0;
          let userPending = parseFloat(user.pending) || 0;
          let refundAmount = parseFloat(booking.price);

          user.balance = String(userBalance + refundAmount);
          user.pending = String(userPending - refundAmount);
          await user.save();

          // Create refund history
          const refundHistory = {
            userid: booking.userid,
            details: "Fan meet request expired - automatic refund processed",
            spent: "0",
            income: `${refundAmount}`,
            date: `${Date.now().toString()}`
          };
          await historydb.create(refundHistory);

          // Send notifications
          await sendEmail(booking.userid, "Your fan meet request has expired and been refunded");
          await sendpushnote(booking.userid, "Your fan meet request has expired and been refunded", "fanicon");
          
          await sendEmail(booking.creatorid, "A fan meet request has expired");
          await sendpushnote(booking.creatorid, "A fan meet request has expired", "creatoricon");
        }
      } catch (err) {
        console.error(`Error processing expired booking ${booking._id}:`, err);
      }
    }

    return res.status(200).json({
      ok: true,
      message: `Processed ${expiredRequests.length} expired requests`
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
