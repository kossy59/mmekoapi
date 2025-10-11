const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");

// Socket.io integration
const { emitFanMeetStatusUpdate } = require('../../utils/socket');

const createLike = async (req, res) => {
  const creator_portfoliio_Id = req.body.creator_portfoliio_Id;
  const userid = req.body.userid;
  const date = req.body.date;
  const time = req.body.time;
  console.log("accept creator " + creator_portfoliio_Id);

  if (!creator_portfoliio_Id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

  //let data = await connectdatabase()

  try {
    const users = await bookingdb.find({ creator_portfoliio_Id: creator_portfoliio_Id }).exec();

    let user = users.find((value) => {
      return (
        String(value.status) === "request" &&
        String(value.userid) === String(userid) &&
        String(value.time) === String(time) &&
        String(value.date) === String(date)
      );
    });

    console.log("under user pending " + user.length);

    if (!user) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!" });
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
    status.status = "accepted";
    await status.save();
    
    // Emit socket event for real-time updates
    emitFanMeetStatusUpdate({
      bookingId: status._id,
      status: 'accepted',
      userid: status.userid,
      creator_portfoliio_Id: status.creator_portfoliio_Id,
      message: '🎉 Fan meet request has been accepted!'
    });
    
    await sendEmail(status.userid, "creator has accepted your booking request");
    await sendpushnote(
      status.userid,
      "creator has accepted your booking request",
      "creatoricon"
    );
    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;

// const bookingdb = require("../../Creators/book");
// let sendEmail = require("../../utiils/sendEmailnot");
// let sendpushnote = require("../../utiils/sendPushnot");

// const AcceptBooking = async (req, res) => {
//   const { creator_portfoliio_Id, userId, date, time } = req.body;

//   if (!creator_portfoliio_Id) {
//     return res.status(404).json({ ok: false, message: "Invalid Modle Id!" });
//   }

//   try {
//     const boookings = await bookingdb.find({ creator_portfoliio_Id: creator_portfoliio_Id }).exec();

//     let filteredBookings = boookings.find((value) => {
//       return (
//         String(value.status) === "pending" &&
//         String(value.userid) === String(userId) &&
//         String(value.time) === String(time) &&
//         String(value.date) === String(date)
//       );
//     });

//     console.log("under user pending " + user.length);

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
