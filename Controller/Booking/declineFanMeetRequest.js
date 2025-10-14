const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
const { pushmessage } = require("../../utiils/sendPushnot");

const declineFanMeetRequest = async (req, res) => {
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

    // Update booking status to declined
    booking.status = "declined";
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
        details: "Fan meet request declined - refund processed",
        spent: "0",
        income: `${refundAmount}`,
        date: `${Date.now().toString()}`
      };
      await historydb.create(refundHistory);
    }

    // Send notifications
    await sendEmail(userid, "Your fan meet request has been declined");
    await pushmessage(userid, "Your fan meet request has been declined", "fanicon");
    
    // Create database notification for fan
    await admindb.create({
      userid: userid,
      message: "Your fan meet request has been declined",
      seen: false
    });
    
    await sendEmail(creator_portfolio_id, "You declined a fan meet request");
    await pushmessage(creator_portfolio_id, "You declined a fan meet request", "creatoricon");
    
    // Create database notification for creator
    await admindb.create({
      userid: creator_portfolio_id,
      message: "You declined a fan meet request",
      seen: false
    });

    return res.status(200).json({
      ok: true,
      message: "Fan meet request declined successfully"
    });

  } catch (err) {
    console.error("Error declining fan meet request:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = declineFanMeetRequest;
