const mongoose = require('mongoose');
require('dotenv').config();

// Import the notification model
const admindb = require('../Creators/admindb');

/**
 * Cleanup script to delete notifications older than 30 days
 * This script can be run manually or via cron job
 */
const cleanupOldNotifications = async () => {
  try {
    console.log('🧹 [NOTIFICATION CLEANUP] Starting cleanup of old notifications...');
    
    // Calculate the cutoff date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log(`📅 [NOTIFICATION CLEANUP] Deleting notifications older than: ${thirtyDaysAgo.toISOString()}`);
    
    // Find notifications older than 30 days
    const oldNotifications = await admindb.find({
      createdAt: { $lt: thirtyDaysAgo }
    }).exec();
    
    console.log(`🔍 [NOTIFICATION CLEANUP] Found ${oldNotifications.length} notifications to delete`);
    
    if (oldNotifications.length === 0) {
      console.log('✅ [NOTIFICATION CLEANUP] No old notifications found. Cleanup complete.');
      return {
        success: true,
        deletedCount: 0,
        message: 'No old notifications found'
      };
    }
    
    // Delete old notifications
    const deleteResult = await admindb.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`🗑️ [NOTIFICATION CLEANUP] Successfully deleted ${deleteResult.deletedCount} notifications`);
    
    // Get updated count
    const remainingCount = await admindb.countDocuments();
    console.log(`📊 [NOTIFICATION CLEANUP] Remaining notifications in database: ${remainingCount}`);
    
    return {
      success: true,
      deletedCount: deleteResult.deletedCount,
      remainingCount: remainingCount,
      message: `Successfully deleted ${deleteResult.deletedCount} notifications older than 30 days`
    };
    
  } catch (error) {
    console.error('❌ [NOTIFICATION CLEANUP] Error during cleanup:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to cleanup old notifications'
    };
  }
};

/**
 * Get notification statistics
 */
const getNotificationStats = async () => {
  try {
    const totalCount = await admindb.countDocuments();
    const unreadCount = await admindb.countDocuments({ seen: false });
    const readCount = await admindb.countDocuments({ seen: true });
    
    // Count notifications by age
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const last24Hours = await admindb.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const lastWeek = await admindb.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const lastMonth = await admindb.countDocuments({ createdAt: { $gte: oneMonthAgo } });
    const olderThanMonth = await admindb.countDocuments({ createdAt: { $lt: oneMonthAgo } });
    
    return {
      total: totalCount,
      unread: unreadCount,
      read: readCount,
      byAge: {
        last24Hours,
        lastWeek,
        lastMonth,
        olderThanMonth
      }
    };
  } catch (error) {
    console.error('❌ [NOTIFICATION STATS] Error getting stats:', error);
    return null;
  }
};

// If this script is run directly (not imported)
if (require.main === module) {
  const runCleanup = async () => {
    try {
      // Connect to MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';
      await mongoose.connect(mongoUri);
      console.log('✅ [NOTIFICATION CLEANUP] Connected to MongoDB');
      
      // Run cleanup
      const result = await cleanupOldNotifications();
      
      // Show stats
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
      
      console.log('✅ [NOTIFICATION CLEANUP] Cleanup completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ [NOTIFICATION CLEANUP] Fatal error:', error);
      process.exit(1);
    }
  };
  
  runCleanup();
}

module.exports = {
  cleanupOldNotifications,
  getNotificationStats
};
