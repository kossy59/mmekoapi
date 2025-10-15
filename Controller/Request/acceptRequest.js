const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");
let sendEmail = require("../../utiils/sendEmailnot");
let { pushActivityNotification } = require("../../utiils/sendPushnot");

// Socket.io integration
const { emitFanRequestStatusUpdate } = require('../../utils/socket');

const createLike = async (req, res) => {
  const creator_portfolio_id = req.body.creator_portfolio_id;
  const userid = req.body.userid;
  const date = req.body.date;
  const time = req.body.time;

  if (!creator_portfolio_id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  //let data = await connectdatabase()

  try {
    const users = await bookingdb.find({ creator_portfolio_id: creator_portfolio_id }).exec();

    let user = users.find((value) => {
      return (
        String(value.status) === "request" &&
        String(value.userid) === String(userid) &&
        String(value.time) === String(time) &&
        String(value.date) === String(date)
      );
    });


    if (!user) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending requests!!" });
    }

    let status = await bookingdb.findOne({ _id: user._id }).exec();
    
    // Check if request has expired
    if (new Date() > new Date(status.expiresAt)) {
      // Move money back from pending to balance
      const fan = await userdb.findOne({ _id: userid }).exec();
      if (fan) {
        let fanBalance = parseFloat(fan.balance) || 0;
        let fanPending = parseFloat(fan.pending) || 0;
        let refundAmount = parseFloat(status.price);

        fan.balance = String(fanBalance + refundAmount);
        fan.pending = String(fanPending - refundAmount);
        await fan.save();

        // Update booking status to expired
        status.status = "expired";
        await status.save();

        // Create refund history
        const refundHistory = {
          userid,
          details: "Fan request expired - refund processed",
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
    status.status = "accepted";
    await status.save();
    
    // Get host type for dynamic message
    const hostType = status.type || "Fan request";
    
    // Emit socket event for real-time updates
    emitFanRequestStatusUpdate({
      bookingId: status._id,
      status: 'accepted',
      userid: status.userid,
      creator_portfolio_id: status.creator_portfolio_id,
      message: `🎉 ${hostType} request has been accepted!`
    });
    
    await sendEmail(status.userid, `Creator has accepted your ${hostType.toLowerCase()} request`);
    await pushActivityNotification(
      status.userid,
      `Creator has accepted your ${hostType.toLowerCase()} request`,
      "booking_accepted"
    );
    
    // Create database notification for fan
    await admindb.create({
      userid: status.userid,
      message: `Your ${hostType} request has been accepted!`,
      seen: false
    });
    
    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;

// const bookingdb = require("../../Creators/book");
// let sendEmail = require("../../utiils/sendEmailnot");
// let { pushActivityNotification } = require("../../utiils/sendPushnot");

// const AcceptBooking = async (req, res) => {
//   const { creator_portfolio_id, userId, date, time } = req.body;

//   if (!creator_portfolio_id) {
//     return res.status(404).json({ ok: false, message: "Invalid Modle Id!" });
//   }

//   try {
//     const boookings = await bookingdb.find({ creator_portfolio_id: creator_portfolio_id }).exec();

//     let filteredBookings = boookings.find((value) => {
//       return (
//         String(value.status) === "pending" &&
//         String(value.userid) === String(userId) &&
//         String(value.time) === String(time) &&
//         String(value.date) === String(date)
//       );
//     });

// 
//     if (!filteredBookings) {
//       return res
//         .status(200)
//         .json({ ok: false, message: "you have 0 pending request!!" });
//     }

//     let updatedBooking = await bookingdb
//       .findOne({ _id: filteredBookings._id })
//       .exec();
//     // console.log('under user accepted')
//     updatedBooking.status = "accepted";
//     await updatedBooking.save();
//     await sendEmail(
//       updatedBooking.userid,
//       "creator has accepted your booking request"
//     );
//     await sendpushnote(
//       updatedBooking.userid,
//       "creator has accepted your booking request",
//       "creatoricon"
//     );
//     return res.status(200).json({ ok: true, message: ` Success` });
//   } catch (err) {
//     return res.status(500).json({ ok: false, message: `${err.message}!` });
//   }
// };

// module.exports = AcceptBooking;
