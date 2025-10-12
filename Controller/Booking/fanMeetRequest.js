const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const historydb = require("../../Creators/mainbalance");
let sendEmail = require("../../utiils/sendEmailnot");
let { pushActivityNotification } = require("../../utiils/sendPushnot");

const createFanMeetRequest = async (req, res) => {
  const {
    userid,
    creator_portfolio_id,
    type,
    time,
    place,
    date,
    price
  } = req.body;

  if (!creator_portfolio_id || !userid) {
    return res.status(400).json({
      ok: false,
      message: "User ID or Creator ID invalid!!"
    });
  }

  try {
    // Get user and creator data
    const user = await userdb.findOne({ _id: userid }).exec();
    const creator = await creatordb.findOne({ _id: creator_portfolio_id }).exec();

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found"
      });
    }

    if (!creator) {
      return res.status(404).json({
        ok: false,
        message: "Creator not found"
      });
    }

    // Check user balance
    let userBalance = parseFloat(user.balance) || 0;
    let userPending = parseFloat(user.pending) || 0;
    let creatorPrice = parseFloat(price);

    if (userBalance < creatorPrice) {
      return res.status(400).json({
        ok: false,
        message: "Insufficient balance!!"
      });
    }

    // Deduct from balance and add to pending
    let newBalance = userBalance - creatorPrice;
    let newPending = userPending + creatorPrice;

    // Update user balance and pending
    user.balance = String(newBalance);
    user.pending = String(newPending);
    await user.save();

    // Create transaction history
    const clientHistory = {
      userid,
      details: "Fan meet request - amount moved to pending",
      spent: `${creatorPrice}`,
      income: "0",
      date: `${Date.now().toString()}`
    };
    await historydb.create(clientHistory);

    // Create booking record
    const bookingData = {
      userid,
      creator_portfolio_id,
      type,
      place,
      time,
      status: "request",
      date,
      price: creatorPrice,
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000 + 14 * 60 * 1000) // 23h 14m from now
    };

    const booking = await bookingdb.create(bookingData);

    // Send notifications
    await sendEmail(creator.userid, "New fan meet request received");
    await pushActivityNotification(creator.userid, "New fan meet request received", "booking_request");
    
    await sendEmail(userid, "Fan meet request sent successfully");
    await pushActivityNotification(userid, "Fan meet request sent successfully", "booking_request");

    return res.status(200).json({
      ok: true,
      message: "Fan meet request created successfully",
      bookingId: booking._id
    });

  } catch (err) {
    console.error("Error creating fan meet request:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = createFanMeetRequest;
