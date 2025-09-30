const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const creatordb = require("../../Creators/creators");

const createLike = async (req, res) => {
  const { id, userid, creatorid } = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  //let data = await connectdatabase()

  try {
    let creators = await creatordb.findOne({ _id: creatorid }).exec();
    let creatorprice = parseFloat(creators.price);
    let clientuser = await userdb.findOne({ _id: userid }).exec();
    let balance = parseFloat(clientuser?.balance || 0) + creatorprice;
    clientuser.balance = `${balance}`;
    await clientuser.save();
    let creatorpaymenthistory = {
      userid: userid,
      details: "Refund issued; you cancelled the request",
      spent: `${0}`,
      income: `${creatorprice}`,
      date: `${Date.now().toString()}`,
    };

    await historydb.create(creatorpaymenthistory);
    const deletedBooking = await bookingdb.findByIdAndDelete(id).exec();
    console.log(creatorprice, "refunded to ", clientuser.firstname);

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
