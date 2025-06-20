const bookingdb = require("../../Models/book");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");

const createLike = async (req, res) => {
  const modelid = req.body.modelid;
  const userid = req.body.userid;
  const date = req.body.date;
  const time = req.body.time;
  console.log("accept model " + modelid);

  if (!modelid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

  //let data = await connectdatabase()

  try {
    const users = await bookingdb.find({ modelid: modelid }).exec();

    let user = users.find((value) => {
      return (
        String(value.status) === "pending" &&
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
    // console.log('under user accepted')
    status.status = "accepted";
    status.save();
    await sendEmail(status.userid, "model has accepted your booking request");
    await sendpushnote(
      status.userid,
      "model has accepted your booking request",
      "modelicon"
    );
    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;

// const bookingdb = require("../../Models/book");
// let sendEmail = require("../../utiils/sendEmailnot");
// let sendpushnote = require("../../utiils/sendPushnot");

// const AcceptBooking = async (req, res) => {
//   const { modelId, userId, date, time } = req.body;

//   if (!modelId) {
//     return res.status(404).json({ ok: false, message: "Invalid Modle Id!" });
//   }

//   try {
//     const boookings = await bookingdb.find({ modelId: modelId }).exec();

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
//       "model has accepted your booking request"
//     );
//     await sendpushnote(
//       updatedBooking.userid,
//       "model has accepted your booking request",
//       "modelicon"
//     );
//     return res.status(200).json({ ok: true, message: ` Success` });
//   } catch (err) {
//     return res.status(500).json({ ok: false, message: `${err.message}!` });
//   }
// };

// module.exports = AcceptBooking;
