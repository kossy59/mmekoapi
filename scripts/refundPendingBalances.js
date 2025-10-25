const requestdb = require("../Creators/requsts");
const userdb = require("../Creators/userdb");
const creatordb = require("../Creators/creators");
const historydb = require("../Creators/mainbalance");

/**
 * Script to refund pending balances when creator portfolios are deleted
 * This handles the case where fans have pending requests but the creator deleted their portfolio
 */
const refundPendingBalances = async () => {
  console.log("Starting refund process for deleted portfolios...");
  
  try {
    // Find all pending requests (including accepted ones)
    const pendingRequests = await requestdb.find({
      status: { $in: ["request", "pending", "accepted"] }
    }).exec();

    console.log(`Found ${pendingRequests.length} pending requests to check`);

    let refundedCount = 0;
    let totalRefundAmount = 0;
    const refundedUsers = new Set();

    for (const request of pendingRequests) {
      try {
        // Check if the creator portfolio still exists
        const creatorExists = await creatordb.findOne({
          _id: request.creator_portfolio_id
        }).exec();

        if (!creatorExists) {
          console.log(`Portfolio ${request.creator_portfolio_id} not found for request ${request._id}`);
          
          // Get the user who made the request
          const user = await userdb.findOne({ _id: request.userid }).exec();
          
          if (user) {
            const refundAmount = parseFloat(request.price) || 0;
            const currentBalance = parseFloat(user.balance) || 0;
            const currentPending = parseFloat(user.pending) || 0;

            // Refund the user - move money from pending back to balance
            user.balance = String(currentBalance + refundAmount);
            user.pending = String(Math.max(0, currentPending - refundAmount));
            await user.save();

            // Create refund history entry
            const refundHistory = {
              userid: request.userid,
              details: `Refund for deleted portfolio - ${request.type || 'Fan meet'} request`,
              spent: "0",
              income: `${refundAmount}`,
              date: `${Date.now().toString()}`
            };
            await historydb.create(refundHistory);

            // Update request status to cancelled
            request.status = "cancelled";
            await request.save();

            refundedCount++;
            totalRefundAmount += refundAmount;
            refundedUsers.add(request.userid);

            console.log(`Refunded ${refundAmount} to user ${request.userid} for deleted portfolio ${request.creator_portfolio_id}`);
          } else {
            console.log(`User ${request.userid} not found for request ${request._id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing request ${request._id}:`, error);
      }
    }

    console.log(`Refund process completed:`);
    console.log(`- Requests processed: ${pendingRequests.length}`);
    console.log(`- Users refunded: ${refundedUsers.size}`);
    console.log(`- Total refund amount: ${totalRefundAmount}`);
    console.log(`- Requests cancelled: ${refundedCount}`);

    return {
      success: true,
      processed: pendingRequests.length,
      refunded: refundedUsers.size,
      totalAmount: totalRefundAmount,
      cancelledRequests: refundedCount
    };

  } catch (error) {
    console.error("Error during refund process:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process refunds for a specific portfolio when it's being deleted
 */
const processPortfolioDeletionRefund = async (creatorPortfolioId) => {
  console.log(`🔄 Processing refunds for deleted portfolio: ${creatorPortfolioId}`);
  
  try {
    // Find all pending requests for this portfolio (including accepted ones)
    const pendingRequests = await requestdb.find({
      creator_portfolio_id: creatorPortfolioId,
      status: { $in: ["request", "pending", "accepted"] }
    }).exec();

    console.log(`📊 Found ${pendingRequests.length} pending requests for deleted portfolio`);
    
    if (pendingRequests.length === 0) {
      console.log(`ℹ️ No pending requests found for portfolio ${creatorPortfolioId}`);
      return {
        success: true,
        processed: 0,
        totalAmount: 0
      };
    }

    let refundedCount = 0;
    let totalRefundAmount = 0;

    for (const request of pendingRequests) {
      try {
        const user = await userdb.findOne({ _id: request.userid }).exec();
        
        if (user) {
          const refundAmount = parseFloat(request.price) || 0;
          const currentBalance = parseFloat(user.balance) || 0;
          const currentPending = parseFloat(user.pending) || 0;

          console.log(`💰 Refunding user ${request.userid}: ${refundAmount} (balance: ${currentBalance} -> ${currentBalance + refundAmount}, pending: ${currentPending} -> ${Math.max(0, currentPending - refundAmount)})`);

          // Refund the user - move money from pending back to balance
          user.balance = String(currentBalance + refundAmount);
          user.pending = String(Math.max(0, currentPending - refundAmount));
          await user.save();

          // Create refund history entry
          const refundHistory = {
            userid: request.userid,
            details: `Portfolio deleted - ${request.type || 'Fan meet'} request refund`,
            spent: "0",
            income: `${refundAmount}`,
            date: `${Date.now().toString()}`
          };
          await historydb.create(refundHistory);

          // Update request status to cancelled
          request.status = "cancelled";
          await request.save();

          refundedCount++;
          totalRefundAmount += refundAmount;

          console.log(`✅ Refunded ${refundAmount} to user ${request.userid}`);
        } else {
          console.log(`❌ User ${request.userid} not found for request ${request._id}`);
        }
      } catch (error) {
        console.error(`Error processing refund for request ${request._id}:`, error);
      }
    }

    console.log(`Portfolio deletion refunds completed:`);
    console.log(`- Requests processed: ${pendingRequests.length}`);
    console.log(`- Total refund amount: ${totalRefundAmount}`);

    return {
      success: true,
      processed: pendingRequests.length,
      totalAmount: totalRefundAmount
    };

  } catch (error) {
    console.error("Error processing portfolio deletion refunds:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get statistics about pending balances and orphaned requests
 */
const getPendingBalanceStats = async () => {
  try {
    const pendingRequests = await requestdb.find({
      status: { $in: ["request", "pending", "accepted"] }
    }).exec();

    let orphanedCount = 0;
    let orphanedAmount = 0;
    const orphanedPortfolios = new Set();

    for (const request of pendingRequests) {
      const creatorExists = await creatordb.findOne({
        _id: request.creator_portfolio_id
      }).exec();

      if (!creatorExists) {
        orphanedCount++;
        orphanedAmount += parseFloat(request.price) || 0;
        orphanedPortfolios.add(request.creator_portfolio_id);
      }
    }

    return {
      totalPendingRequests: pendingRequests.length,
      orphanedRequests: orphanedCount,
      orphanedAmount: orphanedAmount,
      orphanedPortfolios: Array.from(orphanedPortfolios)
    };
  } catch (error) {
    console.error("Error getting pending balance stats:", error);
    return null;
  }
};

module.exports = {
  refundPendingBalances,
  processPortfolioDeletionRefund,
  getPendingBalanceStats
};
