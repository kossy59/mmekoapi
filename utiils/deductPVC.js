const creatordb = require("../Creators/creators");
let bookdb = require("../Creators/book");
let userdb = require("../Creators/userdb");
historydb = require("../Creators/mainbalance");
const pay = async (userid, toid, balance, amount) => {
  let creator_portfoliio_Id = await creatordb.findOne({ userid: toid }).exec();

  if (creator_portfoliio_Id) {
    // getting creator for knowing it booking price
    //let creator = await creatordb.findOne({_id:uscreator_portfoliio_Id}).exec()

    //console.log("creator price "+price)
    let user_paying = await userdb.findOne({ _id: userid }).exec();

    let clienthistory = {
      userid: userid,
      details: `private call payment from ${creator_portfoliio_Id.name}`,
      spent: `${amount}`,
      income: "0",
      date: `${Date.now().toString()}`,
    };
    creator_portfoliio_Id.earnings = (creator_portfoliio_Id?.earnings ?? 0) + Number(amount);
    await creator_portfoliio_Id.save();

    user_paying.balance = `${balance}`;

    await user_paying.save();

    await historydb.create(clienthistory);
  }
};

module.exports = pay;
