const cron = require('node-cron');
const { cleanupOldNotifications, getNotificationStats } = require('./cleanupOldNotifications');

/**
 * Setup daily notification cleanup cron job
 * Runs every day at 2:00 AM to clean up notifications older than 30 days
 */
const setupNotificationCleanup = () => {
  console.log('🕐 [NOTIFICATION CLEANUP] Setting up daily notification cleanup cron job...');
  
  // Schedule cleanup to run daily at 2:00 AM
  const cleanupJob = cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [NOTIFICATION CLEANUP] Daily cleanup job triggered at 2:00 AM');
    
    try {
      const result = await cleanupOldNotifications();
      
      if (result.success) {
        console.log(`✅ [NOTIFICATION CLEANUP] Daily cleanup completed: ${result.message}`);
        if (result.deletedCount > 0) {
          console.log(`🗑️ [NOTIFICATION CLEANUP] Deleted ${result.deletedCount} old notifications`);
        }
      } else {
        console.error(`❌ [NOTIFICATION CLEANUP] Daily cleanup failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [NOTIFICATION CLEANUP] Error in daily cleanup job:', error);
    }
  }, {
    scheduled: false, // Don't start automatically
    timezone: "UTC"
  });
  
  // Start the cron job
  cleanupJob.start();
  console.log('✅ [NOTIFICATION CLEANUP] Daily cleanup cron job started (runs at 2:00 AM UTC)');
  
  return cleanupJob;
};

/**
 * Manual cleanup function for testing or immediate cleanup
 */
const runManualCleanup = async () => {
  console.log('🧹 [NOTIFICATION CLEANUP] Running manual cleanup...');
  
  try {
    const result = await cleanupOldNotifications();
    
    if (result.success) {
      console.log(`✅ [NOTIFICATION CLEANUP] Manual cleanup completed: ${result.message}`);
      
      // Show updated stats
      const stats = await getNotificationStats();
      if (stats) {
        console.log('📊 [NOTIFICATION STATS] Updated notification statistics:');
        console.log(`   Total: ${stats.total}`);
        console.log(`   Unread: ${stats.unread}`);
        console.log(`   Read: ${stats.read}`);
        console.log(`   Last 24h: ${stats.byAge.last24Hours}`);
        console.log(`   Last week: ${stats.byAge.lastWeek}`);
        console.log(`   Last month: ${stats.byAge.lastMonth}`);
        console.log(`   Older than month: ${stats.byAge.olderThanMonth}`);
      }
      
      return result;
    } else {
      console.error(`❌ [NOTIFICATION CLEANUP] Manual cleanup failed: ${result.message}`);
      return result;
    }
  } catch (error) {
    console.error('❌ [NOTIFICATION CLEANUP] Error in manual cleanup:', error);
    return {
      success: false,
      error: error.message,
      message: 'Manual cleanup failed'
    };
  }
};

/**
 * Get current notification statistics
 */
const getStats = async () => {
  try {
    const stats = await getNotificationStats();
    if (stats) {
      console.log('📊 [NOTIFICATION STATS] Current notification statistics:');
      console.log(`   Total: ${stats.total}`);
      console.log(`   Unread: ${stats.unread}`);
      console.log(`   Read: ${stats.read}`);
      console.log(`   Last 24h: ${stats.byAge.last24Hours}`);
      console.log(`   Last week: ${stats.byAge.lastWeek}`);
      console.log(`   Last month: ${stats.byAge.lastMonth}`);
      console.log(`   Older than month: ${stats.byAge.olderThanMonth}`);
    }
    return stats;
  } catch (error) {
    console.error('❌ [NOTIFICATION STATS] Error getting stats:', error);
    return null;
  }
};

module.exports = {
  setupNotificationCleanup,
  runManualCleanup,
  getStats
};
