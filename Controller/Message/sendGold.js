const userdb = require("../../Models/userdb");
const historydb = require("../../Models/mainbalance");
const modeldb = require("../../Models/models");
const giftdb = require("../../Models/gift");
// const { model } = require("mongoose");

const createModel = async (req, res) => {
  const modelid = req.body.modelid;
  const userid = req.body.userid;
  const amount = req.body.amount;

  if (!userid && !modelid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  let withdraw = await userdb.findOne({ _id: modelid }).exec();

  try {
    let user = await userdb.findOne({ _id: userid }).exec();

    if (!user) {
      return res.status(400).json({ ok: false, message: "user Id invalid!!" });
    }

    let user_balance = parseFloat(user.balance);
    let gold_amount = parseFloat(amount);

    if (user_balance < gold_amount) {
      return res
        .status(400)
        .json({ ok: false, message: "insufficent balance top up please!!" });
    }

    user_balance = user_balance - gold_amount;

    let user_history = {
      userid: userid,
      details: "Gifts Gold",
      spent: `${gold_amount}`,
      income: "0",
      date: `${Date.now().toString()}`,
    };

    await historydb.create(user_history);

    let model_as_user = await get_model_userID(modelid);
    // console.log("Under model convert "+model_as_user)
    let model_history = {
      userid: modelid,
      details: "Receives gold gift",
      spent: "0",
      income: `${gold_amount}`,
      date: `${Date.now().toString()}`,
    };

    await historydb.create(model_history);

    let gift = {
      modelid: modelid,
      userid: userid,
      date: `${Date.now()}`,
      amount: `${gold_amount}`,
    };

    await giftdb.create(gift);
    console.log("Under gift create");

    user.balance = `${user_balance}`;
    user.save();

    let withdraw_balance = parseFloat(withdraw.withdrawbalance);

    if (!withdraw_balance || withdraw_balance <= 0) {
      withdraw_balance = 0;
    }

    withdraw_balance = withdraw_balance + gold_amount;
    console.log("gold sent " + withdraw_balance);

    withdraw.withdrawbalance = `${withdraw_balance}`;
    model_as_user.earnings =
      (model_as_user?.earnings ?? 0) + Number(gold_amount);
    await model_as_user.save();
    withdraw.save();

    return res.status(200).json({ ok: true, message: "gift success!!" });
  } catch (err) {
    console.log("message erro " + err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createModel;

const get_model_userID = async (modelid) => {
  let user = await modeldb.findOne({ userid: modelid }).exec();

  //let userid = await userdb.findOne({_id : user.userid}).exec()

  return user;
};
