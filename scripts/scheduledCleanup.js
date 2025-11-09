const cron = require('node-cron');
const { cleanupOrphanedPendingBalances, getPendingBalanceStats } = require('./cleanupOrphanedPendingBalances');

/**
 * Scheduled cleanup script for orphaned pending balances
 * Runs every 6 hours to check for deleted portfolios and refund users
 */
class ScheduledCleanup {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.lastStats = null;
  }

  /**
   * Start the scheduled cleanup process
   */
  start() {
    // Run cleanup every 6 hours (0 */6 * * *)
    this.cleanupTask = cron.schedule('0 */6 * * *', async () => {
      await this.runCleanup();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Run initial cleanup on startup
    setTimeout(() => {
      this.runCleanup();
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Stop the scheduled cleanup
   */
  stop() {
    if (this.cleanupTask) {
      this.cleanupTask.destroy();
    }
  }

  /**
   * Run the cleanup process
   */
  async runCleanup() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();

    try {
      // Get stats before cleanup
      const beforeStats = await getPendingBalanceStats();

      // Run the cleanup
      const result = await cleanupOrphanedPendingBalances();
      
      // Get stats after cleanup
      const afterStats = await getPendingBalanceStats();
      this.lastStats = {
        before: beforeStats,
        after: afterStats,
        result: result,
        timestamp: this.lastRun
      };

    } catch (error) {
      console.error("Error during scheduled cleanup:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get the status of the cleanup service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      lastStats: this.lastStats,
      nextRun: this.cleanupTask ? this.cleanupTask.nextDate() : null
    };
  }

  /**
   * Manually trigger cleanup
   */
  async manualCleanup() {
    await this.runCleanup();
  }
}

// Create singleton instance
const scheduledCleanup = new ScheduledCleanup();

module.exports = scheduledCleanup;
