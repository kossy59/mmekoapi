const { getPendingBalanceStats } = require("../../scripts/cleanupOrphanedPendingBalances");
const scheduledCleanup = require("../../scripts/scheduledCleanup");

/**
 * Get cleanup status and statistics
 * Admin endpoint to monitor orphaned pending balances
 */
const getCleanupStatus = async (req, res) => {
  try {
    // Get current statistics
    const stats = await getPendingBalanceStats();
    
    // Get scheduled cleanup status
    const cleanupStatus = scheduledCleanup.getStatus ? scheduledCleanup.getStatus() : {
      isRunning: false,
      lastRun: null,
      nextRun: null,
      lastStats: null
    };
    
    const response = {
      ok: true,
      data: {
        statistics: stats,
        cleanupService: {
          isRunning: cleanupStatus.isRunning,
          lastRun: cleanupStatus.lastRun,
          nextRun: cleanupStatus.nextRun,
          lastStats: cleanupStatus.lastStats
        },
        timestamp: new Date().toISOString()
      }
    };

    return res.status(200).json(response);
    
  } catch (error) {
    console.error("Error getting cleanup status:", error);
    return res.status(500).json({
      ok: false,
      message: "Error getting cleanup status",
      error: error.message
    });
  }
};

/**
 * Manually trigger cleanup
 * Admin endpoint to manually run cleanup
 */
const triggerCleanup = async (req, res) => {
  try {
    console.log("Manual cleanup triggered by admin");
    
    // Trigger manual cleanup
    if (scheduledCleanup.manualCleanup) {
      await scheduledCleanup.manualCleanup();
    } else {
      // Fallback: run cleanup directly
      const { cleanupOrphanedPendingBalances } = require("../../scripts/cleanupOrphanedPendingBalances");
      await cleanupOrphanedPendingBalances();
    }
    
    // Get updated statistics
    const stats = await getPendingBalanceStats();
    
    return res.status(200).json({
      ok: true,
      message: "Manual cleanup completed",
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
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
  getCleanupStatus,
  triggerCleanup,
  getOrphanedRequests
};
