const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
const { pushmessage } = require("../../utiils/sendPushnot");

const cancelFanMeetRequest = async (req, res) => {
  const {
    bookingId,
    userid
  } = req.body;

  if (!bookingId || !userid) {
    return res.status(400).json({
      ok: false,
      message: "Missing required parameters"
    });
  }

  try {
    // Find the booking
    const booking = await bookingdb.findOne({ 
      _id: bookingId,
      userid: userid,
      status: "request"
    }).exec();

    if (!booking) {
      return res.status(404).json({
        ok: false,
        message: "Booking request not found or already processed"
      });
    }

    // Update booking status to cancelled
    booking.status = "cancelled";
    await booking.save();

    // Get host type for dynamic messages
    const hostType = booking.type || "Fan meet";

    // Refund the user - move money from pending back to balance
    const user = await userdb.findOne({ _id: userid }).exec();
    if (user) {
      let userBalance = parseFloat(user.balance) || 0;
      let userPending = parseFloat(user.pending) || 0;
      let refundAmount = parseFloat(booking.price);

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
    await pushmessage(userid, `Your ${hostType.toLowerCase()} request has been cancelled`, "fanicon");
    
    // Create database notification for fan
    await admindb.create({
      userid: userid,
      message: `Your ${hostType.toLowerCase()} request has been cancelled`,
      seen: false
    });
    
    await sendEmail(booking.creator_portfolio_id, `A fan cancelled their ${hostType.toLowerCase()} request`);
    await pushmessage(booking.creator_portfolio_id, `A fan cancelled their ${hostType.toLowerCase()} request`, "creatoricon");
    
    // Create database notification for creator
    await admindb.create({
      userid: booking.creator_portfolio_id,
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

module.exports = cancelFanMeetRequest;
