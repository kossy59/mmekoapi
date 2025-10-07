const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const creatordb = require("../../Creators/creators");

// Socket.io integration
const { emitFanMeetStatusUpdate } = require('../../utils/socket');

const createLike = async (req, res) => {
  const { id, userid, creatorid } = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  //let data = await connectdatabase()

  try {
    // Get the booking first to get the actual price
    const booking = await bookingdb.findById(id).exec();
    if (!booking) {
      return res.status(404).json({ ok: false, message: "Booking not found." });
    }

    let clientuser = await userdb.findOne({ _id: userid }).exec();
    if (!clientuser) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    let clientbalance = parseFloat(clientuser.balance) || 0;
    let clientpending = parseFloat(clientuser.pending) || 0;
    let refundAmount = parseFloat(booking.price);

    // Move money from pending back to balance
    clientuser.balance = String(clientbalance + refundAmount);
    clientuser.pending = String(clientpending - refundAmount);
    await clientuser.save();

    let creatorpaymenthistory = {
      userid: userid,
      details: "Fan meet request cancelled - refund processed",
      spent: "0",
      income: `${refundAmount}`,
      date: `${Date.now().toString()}`,
    };

    await historydb.create(creatorpaymenthistory);
    
    // Get booking details before deletion for socket emission
    const bookingToDelete = await bookingdb.findById(id).exec();
    
    const deletedBooking = await bookingdb.findByIdAndDelete(id).exec();

    // Emit socket event for real-time updates
    if (deletedBooking && bookingToDelete) {
      emitFanMeetStatusUpdate({
        bookingId: id,
        status: 'cancelled',
        userid: userid,
        creatorid: creatorid,
        message: '🚫 Fan meet request was cancelled'
      });
    }

    if (deletedBooking) {
      return res
        .status(200)
        .json({ ok: true, message: `Deleted successfully` });
    }
    res.status(404).json({ ok: false, message: "Booking not found." });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};
module.exports = createLike;
