const historydb = require("../../Creators/mainbalance");

const getTransactionHistory = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(409).json({ ok: false, message: "No user ID!!" });
  }


  try {
    // First, find the creator ID for this user
    const creatordb = require("../../Creators/creators");
    const creatorRecord = await creatordb.findOne({ userid: userid }).exec();
    const creator_portfolio_id = creatorRecord ? creatorRecord._id : null;
    
    // Get all transaction history for this user (both as user and as creator)
    let allTransactions = await historydb.find({ userid: userid })
      .sort({ date: -1 })
      .exec();
    
    // Also try querying with ObjectId format in case there's a mismatch
    const mongoose = require('mongoose');
    let allTransactionsObjectId = await historydb.find({ userid: new mongoose.Types.ObjectId(userid) })
      .sort({ date: -1 })
      .exec();
    
    // If user is a creator, also get transactions for their creator ID
    let creatorTransactions = [];
    if (creator_portfolio_id) {
      creatorTransactions = await historydb.find({ userid: creator_portfolio_id })
        .sort({ date: -1 })
        .exec();
    }
    
    
    // Test transaction creation removed - no longer needed
    
    // Combine all transactions (user + creator)
    let combinedTransactions = [...allTransactions, ...allTransactionsObjectId, ...creatorTransactions];
    
    // Remove duplicates based on _id
    const uniqueTransactions = combinedTransactions.filter((transaction, index, self) => 
      index === self.findIndex(t => t._id.toString() === transaction._id.toString())
    );
    
    // Sort by date (newest first)
    uniqueTransactions.sort((a, b) => new Date(parseInt(b.date)) - new Date(parseInt(a.date)));
    
    allTransactions = uniqueTransactions;
    

    // Filter only earnings-related transactions (not balance transactions)
    let earningsTransactions = allTransactions.filter(transaction => {
      const details = transaction.details || "";
      const detailsLower = details.toLowerCase();
      const isEarningsTransaction = 
        // Any host type earnings (creator receives) - Fan meet, Fan date, Fan call, etc.
        details.includes("completed - payment received") ||
        // Any host type payments (fan pays) - Fan meet, Fan date, Fan call, etc.
        details.includes("completed - payment transferred") ||
        // Video call earnings (creator receives)
        details.includes("Fan call - payment received") ||
        // Video call payments (fan pays)
        details.includes("Fan call - payment for") ||
        // Exclusive post earnings (creator receives)
        details.includes("exclusive post sale") ||
        details.includes("exclusive post") ||
        // Withdrawal from earnings
        detailsLower.includes("withdrawal") ||
        detailsLower.includes("withdraw") ||
        detailsLower.includes("earnings") ||
        // Refunds that affect earnings (these are balance transactions, not earnings)
        // We exclude refunds as they affect balance, not earnings
        false;
      
      // Exclude balance-related transactions
      const isBalanceTransaction = 
        details.includes("refund") ||
        details.includes("expired") ||
        details.includes("cancelled") ||
        details.includes("declined") ||
        details.includes("balance");
      
      const shouldInclude = isEarningsTransaction && !isBalanceTransaction;
      
      return shouldInclude;
    });

    // Transform the data to match frontend expectations
    let formattedTransactions = earningsTransactions.map((transaction, index) => {
      // Determine transaction type and amount
      let amount = "0";
      let description = transaction.details || "Transaction";
      let status = "completed";
      
      if (transaction.income && parseFloat(transaction.income) > 0) {
        // This is an earning addition
        amount = `+${transaction.income}`;
        description = transaction.details || "Earning received";
      } else if (transaction.spent && parseFloat(transaction.spent) > 0) {
        // This is an earning deduction
        amount = `-${transaction.spent}`;
        description = transaction.details || "Earning spent";
      }

      return {
        id: transaction._id.toString(),
        created_at: new Date(parseInt(transaction.date)).toISOString(),
        amount: amount,
        description: description,
        status: status,
        // Keep original data for debugging
        original: {
          income: transaction.income,
          spent: transaction.spent,
          details: transaction.details,
          date: transaction.date
        }
      };
    });


    return res.status(200).json({ 
      ok: true, 
      message: "Transaction history fetched successfully", 
      transactions: formattedTransactions 
    });

  } catch (err) {
    console.error("Error fetching transaction history:", err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getTransactionHistory;
