const bookingdb = require("../../Creators/book");
const creatordb = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
let sendEmail = require("../../utiils/sendEmailnot");
let sendpushnote = require("../../utiils/sendPushnot");
const historydb = require("../../Creators/mainbalance");
const createLike = async (req, res) => {
  const creatorid = req.body.creatorid;
  const userid = req.body.userid;
  const date = req.body.date;
  const time = req.body.time;

  if (!creatorid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  // console.log('untop init db')

  try {
    const users = await bookingdb.find({ creatorid: creatorid }).exec();

    let user = users.find((value) => {
      return (
        String(value.status) === "pending" ||
        (String(value.status) === "accepted" &&
          String(value.userid) === String(userid) &&
          String(value.time) === String(time) &&
          String(value.date) === String(date))
      );
    });

    if (!user) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 pending request!!" });
    }

    let status = await bookingdb.findOne({ _id: user._id }).exec();

    status.status = "decline";
    status.save();

    if (status.type !== "Private show") {
      let creators = await creatordb.findOne({ _id: creatorid }).exec();
      let creatorprice = parseFloat(creators.price);
      let clientuser = await userdb.findOne({ _id: userid }).exec();

      let clientbalance = parseFloat(clientuser.balance);
      if (!clientbalance || clientbalance <= 0) {
        clientbalance = 0;
      }
      clientbalance = clientbalance + creatorprice;
      clientuser.balance = `${clientbalance}`;
      await clientuser.save();

      let creatorpaymenthistory = {
        userid: userid,
        details: "Refound issued; creator cancellation confirmation",
        spent: `${0}`,
        income: `${creatorprice}`,
        date: `${Date.now().toString()}`,
      };

      await historydb.create(creatorpaymenthistory);
    }

    await sendEmail(userid, "Creator declined your Booking");
    await sendpushnote(userid, "Creator declined your Booking", "creatoricon");

    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
