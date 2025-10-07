const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");
const historydb = require("../../Creators/mainbalance");

const createLike = async (req, res) => {
  const creatorid = req.body.creatorid;
  const date = req.body.date;
  const time = req.body.time;
  const userid = req.body.userid;

  if (!creatorid) {
    return res.status(400).json({ ok: false, message: "Creator ID is missing or invalid" });
  }

  //let data = await connectdatabase()

  try {
    let bookings = await bookingdb.find({ userid: userid }).exec();

    if (!bookings[0]) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!" });
    }

    let book = bookings.find((value) => {
      return (
        (String(value.date) === String(date) &&
          String(value.time) === String(time) &&
          String(value.creatorid) === String(creatorid) &&
          String(value.status) === "request") ||
        String(value.status) === "decline"
      );
    });

    if (!book) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!" });
    }

    // Try to find creator by _id first, then by userid
    let creatoruser = await creatordb.findOne({ _id: creatorid }).exec();
    if (!creatoruser) {
      creatoruser = await creatordb.findOne({ userid: creatorid }).exec();
    }
    
            if (!creatoruser) {
              return res.status(400).json({ ok: false, message: "Creator not found" });
            }
    
    let creatorprice = parseFloat(creatoruser.price);

    if (book.type !== "Private show") {
      let clientuser = await userdb.findOne({ _id: userid }).exec();

      let clientbalance = parseFloat(clientuser.balance);
      let clientpending = parseFloat(clientuser.pending);

      if (!clientbalance) {
        clientbalance = 0;
      }
      if (!clientpending) {
        clientpending = 0;
      }

      // Move money from pending back to balance
      clientbalance = clientbalance + creatorprice;
      clientpending = clientpending - creatorprice;
      
      clientuser.balance = `${clientbalance}`;
      clientuser.pending = `${clientpending}`;
      clientuser.save();

      let creatorpaymenthistory = {
        userid: userid,
        details: "Fan meet request cancelled - refund processed",
        spent: `${0}`,
        income: `${creatorprice}`,
        date: `${Date.now().toString()}`,
      };

      await historydb.create(creatorpaymenthistory);
    }

    await bookingdb.deleteOne({ _id: book._id }).exec();


    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};
module.exports = createLike;
