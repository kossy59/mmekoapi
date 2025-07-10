const bookingdb = require("../../Models/book");
const userdb = require("../../Models/userdb");
const historydb = require("../../Models/mainbalance");
const modeldb = require("../../Models/models");

const createLike = async (req, res) => {
  const { id, userid, modelid } = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  //let data = await connectdatabase()

  try {
    let models = await modeldb.findOne({ _id: modelid }).exec();
    let modelprice = parseFloat(models.price);
    let clientuser = await userdb.findOne({ _id: userid }).exec();
    let balance = parseFloat(clientuser?.balance || 0) + modelprice;
    clientuser.balance = `${balance}`;
    await clientuser.save();
    let modelpaymenthistory = {
      userid: userid,
      details: "Refund issued; you cancelled the request",
      spent: `${0}`,
      income: `${modelprice}`,
      date: `${Date.now().toString()}`,
    };

    await historydb.create(modelpaymenthistory);
    const deletedBooking = await bookingdb.findByIdAndDelete(id).exec();
    console.log(modelprice, "refunded to ", clientuser.firstname);

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
