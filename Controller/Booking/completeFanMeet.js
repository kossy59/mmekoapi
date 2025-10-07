const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const historydb = require("../../Creators/mainbalance");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");

const completeFanMeet = async (req, res) => {
  const {
    bookingId,
    userid,
    creatorid
  } = req.body;

  if (!bookingId || !userid || !creatorid) {
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
      creatorid: creatorid,
      status: "accepted"
    }).exec();

    if (!booking) {
      return res.status(404).json({
        ok: false,
        message: "Accepted booking not found"
      });
    }

    // Update booking status to completed
    booking.status = "completed";
    await booking.save();

    // Transfer money from user's pending to creator's earnings
    const user = await userdb.findOne({ _id: userid }).exec();
    const creator = await userdb.findOne({ _id: creatorid }).exec();

    if (user && creator) {
      let userPending = parseFloat(user.pending) || 0;
      let creatorEarnings = parseFloat(creator.earnings) || 0;
      let transferAmount = parseFloat(booking.price);

      // Deduct from user's pending
      user.pending = String(userPending - transferAmount);
      await user.save();

      // Add to creator's earnings
      creator.earnings = String(creatorEarnings + transferAmount);
      await creator.save();

      // Create transaction histories
      const userHistory = {
        userid,
        details: "Fan meet completed - payment transferred to creator",
        spent: `${transferAmount}`,
        income: "0",
        date: `${Date.now().toString()}`
      };
      await historydb.create(userHistory);

      const creatorHistory = {
        userid: creatorid,
        details: "Fan meet completed - payment received",
        spent: "0",
        income: `${transferAmount}`,
        date: `${Date.now().toString()}`
      };
      await historydb.create(creatorHistory);
    }

    // Send notifications
    await sendEmail(userid, "Fan meet completed successfully!");
    await sendpushnote(userid, "Fan meet completed successfully!", "fanicon");
    
    await sendEmail(creatorid, "Fan meet completed - payment received!");
    await sendpushnote(creatorid, "Fan meet completed - payment received!", "creatoricon");

    return res.status(200).json({
      ok: true,
      message: "Fan meet completed successfully"
    });

  } catch (err) {
    console.error("Error completing fan meet:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = completeFanMeet;
