const bookingdb = require("../../Creators/book");
const creatordb = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
let sendEmail = require("../../utiils/sendEmailnot");
let { pushActivityNotification } = require("../../utiils/sendPushnot");
const historydb = require("../../Creators/mainbalance");

// Socket.io integration
const { emitFanMeetStatusUpdate } = require('../../utils/socket');
const createLike = async (req, res) => {
  const creator_portfolio_id = req.body.creator_portfolio_id;
  const userid = req.body.userid;
  const date = req.body.date;
  const time = req.body.time;

  if (!creator_portfolio_id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  // console.log('untop init db')

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
        .json({ ok: false, message: "you have 0 pending request!!" });
    }

    let status = await bookingdb.findOne({ _id: user._id }).exec();

    status.status = "declined";
    await status.save();

    // Emit socket event for real-time updates
    emitFanMeetStatusUpdate({
      bookingId: status._id,
      status: 'declined',
      userid: status.userid,
      creator_portfolio_id: status.creator_portfolio_id,
      message: '❌ Fan meet request was declined'
    });

    // Refund the user - move money from pending back to balance
    const clientuser = await userdb.findOne({ _id: userid }).exec();
    if (clientuser) {
      let clientbalance = parseFloat(clientuser.balance) || 0;
      let clientpending = parseFloat(clientuser.pending) || 0;
      let refundAmount = parseFloat(status.price);

      clientuser.balance = String(clientbalance + refundAmount);
      clientuser.pending = String(clientpending - refundAmount);
      await clientuser.save();

      let creatorpaymenthistory = {
        userid: userid,
        details: "Fan meet request declined - refund processed",
        spent: "0",
        income: `${refundAmount}`,
        date: `${Date.now().toString()}`,
      };

      await historydb.create(creatorpaymenthistory);
    }

    await sendEmail(userid, "Creator declined your Booking");
    await pushActivityNotification(userid, "Creator declined your Booking", "booking_declined");

    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
