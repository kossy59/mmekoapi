const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");

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
        details: "Fan meet request cancelled - refund processed",
        spent: "0",
        income: `${refundAmount}`,
        date: `${Date.now().toString()}`
      };
      await historydb.create(refundHistory);
    }

    // Send notifications
    await sendEmail(userid, "Your fan meet request has been cancelled");
    await sendpushnote(userid, "Your fan meet request has been cancelled", "fanicon");
    
    await sendEmail(booking.creatorid, "A fan cancelled their meet request");
    await sendpushnote(booking.creatorid, "A fan cancelled their meet request", "creatoricon");

    return res.status(200).json({
      ok: true,
      message: "Fan meet request cancelled successfully"
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
