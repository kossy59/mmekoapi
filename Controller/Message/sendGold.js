const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const creatordb = require("../../Creators/creators");
const giftdb = require("../../Creators/gift");
// const { creator } = require("mongoose");

const sendGold = async (req, res) => {
  const creator_portfolio_id = req.body.creator_portfolio_id;
  const userid = req.body.userid;
  const amount = req.body.amount;

  if (!userid && !creator_portfolio_id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  let withdraw = await userdb.findOne({ _id: creator_portfolio_id }).exec();

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

    let creator_as_user = await get_creator_userID(creator_portfolio_id);
    // console.log("Under creator convert "+creator_as_user)
    let creator_history = {
      userid: creator_portfolio_id,
      details: "Receives gold gift",
      spent: "0",
      income: `${gold_amount}`,
      date: `${Date.now().toString()}`,
    };

    await historydb.create(creator_history);

    let gift = {
      creator_portfolio_id: creator_portfolio_id,
      userid: userid,
      date: `${Date.now()}`,
      amount: `${gold_amount}`,
    };

    await giftdb.create(gift);

    user.balance = `${user_balance}`;
    user.save();

    let withdraw_balance = parseFloat(withdraw.withdrawbalance);

    if (!withdraw_balance || withdraw_balance <= 0) {
      withdraw_balance = 0;
    }

    withdraw_balance = withdraw_balance + gold_amount;

    withdraw.withdrawbalance = `${withdraw_balance}`;
    creator_as_user.earnings =
      (creator_as_user?.earnings ?? 0) + Number(gold_amount);
    await creator_as_user.save();
    withdraw.save();

    return res.status(200).json({ ok: true, message: "gift success!!" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = sendGold;

const get_creator_userID = async (creator_portfolio_id) => {
  let user = await creatordb.findOne({ userid: creator_portfolio_id }).exec();

  //let userid = await userdb.findOne({_id : user.userid}).exec()

  return user;
};
