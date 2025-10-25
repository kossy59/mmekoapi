const { getPendingBalanceStats: getStats, refundPendingBalances } = require("../../scripts/refundPendingBalances");

/**
 * Get pending balance statistics
 * Admin endpoint to monitor orphaned pending balances
 */
const getPendingBalanceStats = async (req, res) => {
  try {
    const stats = await getStats();
    
    if (!stats) {
      return res.status(500).json({
        ok: false,
        message: "Error getting pending balance statistics"
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        statistics: stats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("Error getting pending balance stats:", error);
    return res.status(500).json({
      ok: false,
      message: "Error getting pending balance statistics",
      error: error.message
    });
  }
};

/**
 * Manually trigger cleanup for orphaned pending balances
 * Admin endpoint to manually run cleanup
 */
const triggerCleanup = async (req, res) => {
  try {
    console.log("Manual cleanup triggered by admin");
    
    const result = await refundPendingBalances();
    
    if (result.success) {
      return res.status(200).json({
        ok: true,
        message: "Cleanup completed successfully",
        data: {
          processed: result.processed,
          refunded: result.refunded,
          totalAmount: result.totalAmount,
          cancelledRequests: result.cancelledRequests
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        ok: false,
        message: "Cleanup failed",
        error: result.error
      });
    }
    
  } catch (error) {
    console.error("Error triggering manual cleanup:", error);
    return res.status(500).json({
      ok: false,
      message: "Error triggering cleanup",
      error: error.message
    });
  }
};

/**
 * Get detailed orphaned requests
 * Admin endpoint to see which requests are orphaned
 */
const getOrphanedRequests = async (req, res) => {
  try {
    const requestdb = require("../../Creators/requsts");
    const creatordb = require("../../Creators/creators");
    
    // Find all pending requests
    const pendingRequests = await requestdb.find({
      status: { $in: ["request", "pending"] }
    }).exec();

    const orphanedRequests = [];
    
    for (const request of pendingRequests) {
      const creatorExists = await creatordb.findOne({
        _id: request.creator_portfolio_id
      }).exec();

      if (!creatorExists) {
        orphanedRequests.push({
          requestId: request._id,
          userid: request.userid,
          creator_portfolio_id: request.creator_portfolio_id,
          type: request.type,
          price: request.price,
          status: request.status,
          createdAt: request.createdAt,
          expiresAt: request.expiresAt
        });
      }
    }

    return res.status(200).json({
      ok: true,
      data: {
        orphanedRequests,
        count: orphanedRequests.length,
        totalAmount: orphanedRequests.reduce((sum, req) => sum + (parseFloat(req.price) || 0), 0)
      }
    });
    
  } catch (error) {
    console.error("Error getting orphaned requests:", error);
    return res.status(500).json({
      ok: false,
      message: "Error getting orphaned requests",
      error: error.message
    });
  }
};

module.exports = {
  getPendingBalanceStats,
  triggerCleanup,
  getOrphanedRequests
};
