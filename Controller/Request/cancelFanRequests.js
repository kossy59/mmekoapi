const requestdb = require("../../Creators/requsts");
const userdb = require("../../Creators/userdb");
const historydb = require("../../Creators/mainbalance");
const creatordb = require("../../Creators/creators");

// Socket.io integration
const { emitFanRequestStatusUpdate } = require('../../utils/socket');

const createLike = async (req, res) => {
  const { id, userid, creator_portfolio_id } = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  //let data = await connectdatabase()

  try {
    // Get the request first to get the actual price
    const request = await requestdb.findById(id).exec();
    if (!request) {
      return res.status(404).json({ ok: false, message: "request not found." });
    }

    let clientuser = await userdb.findOne({ _id: userid }).exec();
    if (!clientuser) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }

    let clientbalance = parseFloat(clientuser.balance) || 0;
    let clientpending = parseFloat(clientuser.pending) || 0;
    let refundAmount = parseFloat(request.price);

    // Move money from pending back to balance
    clientuser.balance = String(clientbalance + refundAmount);
    clientuser.pending = String(clientpending - refundAmount);
    await clientuser.save();

    let creatorpaymenthistory = {
      userid: userid,
      details: "Fan request cancelled - refund processed",
      spent: "0",
      income: `${refundAmount}`,
      date: `${Date.now().toString()}`,
    };

    await historydb.create(creatorpaymenthistory);
    
    // Get request details before deletion for socket emission
    const requestToDelete = await requestdb.findById(id).exec();
    
    const deletedrequest = await requestdb.findByIdAndDelete(id).exec();

    // Emit socket event for real-time updates
    if (deletedrequest && requestToDelete) {
      emitFanRequestStatusUpdate({
        requestId: id,
        status: 'cancelled',
        userid: userid,
        creator_portfolio_id: creator_portfolio_id,
        message: '🚫 Fan request was cancelled'
      });
    }

    if (deletedrequest) {
      return res
        .status(200)
        .json({ ok: true, message: `Deleted successfully` });
    }
    res.status(404).json({ ok: false, message: "request not found." });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};
module.exports = createLike;
