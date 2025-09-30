const creatordb = require("../Creators/creators");
let bookdb = require("../Creators/book");
let userdb = require("../Creators/userdb");
historydb = require("../Creators/mainbalance");
const pay = async (userid, toid, balance, amount) => {
  let creatorid = await creatordb.findOne({ userid: toid }).exec();

  if (creatorid) {
    // getting creator for knowing it booking price
    //let creator = await creatordb.findOne({_id:uscreatorid}).exec()

    //console.log("creator price "+price)
    let user_paying = await userdb.findOne({ _id: userid }).exec();

    let clienthistory = {
      userid: userid,
      details: `private call payment from ${creatorid.name}`,
      spent: `${amount}`,
      income: "0",
      date: `${Date.now().toString()}`,
    };
    creatorid.earnings = (creatorid?.earnings ?? 0) + Number(amount);
    await creatorid.save();

    user_paying.balance = `${balance}`;

    await user_paying.save();

    await historydb.create(clienthistory);
  }
};

module.exports = pay;
