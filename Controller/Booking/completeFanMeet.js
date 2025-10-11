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
    creator_portfoliio_Id
  } = req.body;
  
  console.log("🔍 [COMPLETE_FAN_MEET] Function called with:", { bookingId, userid, creator_portfoliio_Id });

  if (!bookingId || !userid || !creator_portfoliio_Id) {
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
      creator_portfoliio_Id: creator_portfoliio_Id,
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
    let creator = await userdb.findOne({ _id: creator_portfoliio_Id }).exec();
    
    if (!creator) {
      // If not found by _id, try to find by creator_portfoliio_Id (hostid) in creatordb
      const creatorRecord = await creatordb.findOne({ _id: creator_portfoliio_Id }).exec();
      if (creatorRecord) {
        creator = await userdb.findOne({ _id: creatorRecord.userid }).exec();
      }
    }

    // Get host type from booking first, then fallback to creator profile
    let creatorProfile = await creatordb.findOne({ userid: creator_portfoliio_Id }).exec();
    if (!creatorProfile) {
      // If not found by userid, try by _id (in case creator_portfoliio_Id is the profile ID)
      creatorProfile = await creatordb.findOne({ _id: creator_portfoliio_Id }).exec();
    }
    const hostType = booking.type || creatorProfile?.hosttype || "Fan meet";

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
        details: `${hostType} completed - payment transferred to creator`,
        spent: `${transferAmount}`,
        income: "0",
        date: `${Date.now().toString()}`
      };
      await historydb.create(userHistory);

      const creatorHistory = {
        userid: creator_portfoliio_Id,
        details: `${hostType} completed - payment received`,
        spent: "0",
        income: `${transferAmount}`,
        date: `${Date.now().toString()}`
      };
      await historydb.create(creatorHistory);
    }

    // Send notifications
    await sendEmail(userid, `${hostType} completed successfully!`);
    await sendpushnote(userid, `${hostType} completed successfully!`, "fanicon");
    
    await sendEmail(creator_portfoliio_Id, `${hostType} completed - payment received!`);
    await sendpushnote(creator_portfoliio_Id, `${hostType} completed - payment received!`, "creatoricon");

    return res.status(200).json({
      ok: true,
      message: `${hostType} completed successfully`
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
