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
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

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
          String(value.status) === "pending") ||
        String(value.status) === "decline"
      );
    });

    if (!book) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!" });
    }

    let creatoruser = await creatordb.findOne({ _id: creatorid }).exec();
    let creatorprice = parseFloat(creatoruser.price);

    if (book.type !== "Private show") {
      let clientuser = await userdb.findOne({ _id: userid }).exec();

      let clientbalance = parseFloat(clientuser.balance);

      if (!clientbalance) {
        clientbalance = 0;
      }

      clientbalance = creatorprice + clientbalance;
      clientuser.balance = `${clientbalance}`;
      clientuser.save();

      let creatorpaymenthistory = {
        userid: userid,
        details: "Refound issued; creator cancellation confirmation",
        spent: `${0}`,
        income: `${creatorprice}`,
        date: `${Date.now().toString()}`,
      };

      await historydb.create(creatorpaymenthistory);
    }

    await bookingdb.deleteOne({ _id: book._id }).exec();

    // console.log("modeil "+creatorinfo)

    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};
module.exports = createLike;
