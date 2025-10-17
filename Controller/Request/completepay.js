const requestdb = require("../../Creators/requsts");
const creatordb = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
let sendEmail = require("../../utiils/sendEmailnot");
let { pushActivityNotification } = require("../../utiils/sendPushnot");

const createLike = async (req, res) => {
  const userid = req.body.userid;
  const creator_portfolio_id = req.body.creator_portfolio_id;
  const time = req.body.time;
  const date = req.body.date;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }
  console.log("untop init db");

  //let data = await connectdatabase()

  try {
    const users = await requestdb.find({ userid: userid }).exec();
    const paidname = await userdb.findOne({ _id: userid }).exec();

    let user = users.find((value) => {
      return (
        String(value.status) === "accepted" &&
        String(value.creator_portfolio_id) === String(creator_portfolio_id) &&
        String(value.time) === String(time) &&
        String(value.date) === String(date)
      );
    });

    //console.log('under user pending')

    if (!user) {
      return res
        .status(200)
        .json({ ok: false, message: "you have 0 approved request!!" });
    }

    // getting creator for knowing it request price
    let creator = await creatordb.findOne({ _id: user.creator_portfolio_id }).exec();
    let price = parseFloat(creator.price);
    console.log("creator price " + price);

    if (user.type !== "Private show") {
      let creatoruser = await userdb.findOne({ _id: creator.userid }).exec();
      let creatorwitdraw = parseFloat(creatoruser.withdrawbalance);

      let creatorpaymenthistory = {
        userid: creator.userid,
        details: "hosting service completed",
        spent: `${0}`,
        income: `${price}`,
        date: `${Date.now().toString()}`,
      };
      let userpaymenthistory = {
        userid: userid,
        details: `Completed transaction history. ${price} coins was deducted`,
        spent: `${price}`,
        income: "0",
        date: `${Date.now().toString()}`,
      };

      await historydb.create(creatorpaymenthistory);
      await historydb.create(userpaymenthistory);
      const earnings = Number(creator.earnings) + Number(price);
      console.log("Creator Earnings: ", earnings);

      creator.earnings = earnings;
      await creator.save();

      if (!creatorwitdraw) {
        creatorwitdraw = 0;
      }

      creatorwitdraw += price;

      creatoruser.withdrawbalance = `${creatorwitdraw}`;
      creatoruser.save();

      await sendEmail(
        `${creatoruser._id}`,
        `You received ${price} from ${paidname.firstname}`
      );
      await pushActivityNotification(
        `${creatoruser._id}`,
        `You received ${price} from ${paidname.firstname}`,
        "request_completed"
      );
    }

    // getting user of that creator for adding the payment to it's account

    user.status = "completed";
    await user.save();

    return res.status(200).json({ ok: true, message: ` Success` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createLike;
