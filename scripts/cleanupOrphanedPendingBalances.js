const requestdb = require("../Creators/requsts");
const userdb = require("../Creators/userdb");
const creatordb = require("../Creators/creators");
const historydb = require("../Creators/mainbalance");

/**
 * Script to clean up orphaned pending balances when creator portfolios are deleted
 * This script checks all pending requests and refunds users if the creator portfolio no longer exists
 */
const cleanupOrphanedPendingBalances = async () => {
  try {
    // Find all pending requests
    const pendingRequests = await requestdb.find({
      status: { $in: ["request", "pending"] }
    }).exec();

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
          // Get the user who made the request
          const user = await userdb.findOne({ _id: request.userid }).exec();
          
          if (user) {
            const refundAmount = parseFloat(request.price) || 0;
            const currentBalance = parseFloat(user.balance) || 0;
            const currentPending = parseFloat(user.pending) || 0;

            // Refund the user
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
          }
        }
      } catch (error) {
        console.error(`Error processing request ${request._id}:`, error);
      }
    }

    return {
      success: true,
      processed: pendingRequests.length,
      refunded: refundedUsers.size,
      totalAmount: totalRefundAmount,
      cancelledRequests: refundedCount
    };

  } catch (error) {
    console.error("Error during cleanup:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate portfolio existence for a specific request
 * This can be used in real-time request processing
 */
const validatePortfolioExists = async (creatorPortfolioId) => {
  try {
    const creator = await creatordb.findOne({ _id: creatorPortfolioId }).exec();
    return !!creator;
  } catch (error) {
    console.error(`Error validating portfolio ${creatorPortfolioId}:`, error);
    return false;
  }
};

/**
 * Process a single request refund when portfolio is deleted
 * This can be called when a portfolio is deleted
 */
const processPortfolioDeletionRefund = async (creatorPortfolioId) => {
  try {
    // Find all pending requests for this portfolio
    const pendingRequests = await requestdb.find({
      creator_portfolio_id: creatorPortfolioId,
      status: { $in: ["request", "pending"] }
    }).exec();

    let refundedCount = 0;
    let totalRefundAmount = 0;

    for (const request of pendingRequests) {
      try {
        const user = await userdb.findOne({ _id: request.userid }).exec();
        
        if (user) {
          const refundAmount = parseFloat(request.price) || 0;
          const currentBalance = parseFloat(user.balance) || 0;
          const currentPending = parseFloat(user.pending) || 0;

          // Refund the user
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
        }
      } catch (error) {
        console.error(`Error processing refund for request ${request._id}:`, error);
      }
    }

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
      status: { $in: ["request", "pending"] }
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
  cleanupOrphanedPendingBalances,
  validatePortfolioExists,
  processPortfolioDeletionRefund,
  getPendingBalanceStats
};
