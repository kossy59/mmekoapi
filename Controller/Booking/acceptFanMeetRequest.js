const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const historydb = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
let { pushActivityNotification } = require("../../utiils/sendPushnot");

const acceptFanMeetRequest = async (req, res) => {
  const {
    bookingId,
    creator_portfolio_id,
    userid
  } = req.body;

  if (!bookingId || !creator_portfolio_id || !userid) {
    return res.status(400).json({
      ok: false,
      message: "Missing required parameters"
    });
  }

  try {
    // Find the booking
    const booking = await bookingdb.findOne({ 
      _id: bookingId,
      creator_portfolio_id: creator_portfolio_id,
      userid: userid,
      status: "request"
    }).exec();

    if (!booking) {
      return res.status(404).json({
        ok: false,
        message: "Booking request not found or already processed"
      });
    }

    // Check if request has expired
    if (new Date() > new Date(booking.expiresAt)) {
      // Move money back from pending to balance
      const user = await userdb.findOne({ _id: userid }).exec();
      if (user) {
        let userBalance = parseFloat(user.balance) || 0;
        let userPending = parseFloat(user.pending) || 0;
        let refundAmount = parseFloat(booking.price);

        user.balance = String(userBalance + refundAmount);
        user.pending = String(userPending - refundAmount);
        await user.save();

        // Update booking status to expired
        booking.status = "expired";
        await booking.save();

        // Create refund history
        const refundHistory = {
          userid,
          details: "Fan meet request expired - refund processed",
          spent: "0",
          income: `${refundAmount}`,
          date: `${Date.now().toString()}`
        };
        await historydb.create(refundHistory);
      }

      return res.status(400).json({
        ok: false,
        message: "Request has expired"
      });
    }

    // Update booking status to accepted
    booking.status = "accepted";
    await booking.save();

    // Send notification only to the fan (userid is the fan who made the request)
    await sendEmail(userid, "Your fan meet request has been accepted!");
    await pushActivityNotification(userid, "Your fan meet request has been accepted!", "booking_accepted");
    
    // Create database notification for fan
    await admindb.create({
      userid: userid,
      message: "Your fan meet request has been accepted!",
      seen: false
    });

    return res.status(200).json({
      ok: true,
      message: "Fan meet request accepted successfully"
    });

  } catch (err) {
    console.error("Error accepting fan meet request:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = acceptFanMeetRequest;
