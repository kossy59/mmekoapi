const mongoose = require('mongoose');
require('dotenv').config();

// Import the cleanup functions
const { cleanupOldNotifications, getNotificationStats } = require('./cleanupOldNotifications');
const admindb = require('../Creators/admindb');

/**
 * Test script for notification cleanup functionality
 * This script can be run to test the cleanup without affecting production data
 */
const testNotificationCleanup = async () => {
  try {
    console.log('🧪 [NOTIFICATION CLEANUP TEST] Starting test...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';
    await mongoose.connect(mongoUri);
    console.log('✅ [TEST] Connected to MongoDB');
    
    // Get initial stats
    console.log('\n📊 [TEST] Initial notification statistics:');
    const initialStats = await getNotificationStats();
    if (initialStats) {
      console.log(`   Total: ${initialStats.total}`);
      console.log(`   Unread: ${initialStats.unread}`);
      console.log(`   Read: ${initialStats.read}`);
      console.log(`   Last 24h: ${initialStats.byAge.last24Hours}`);
      console.log(`   Last week: ${initialStats.byAge.lastWeek}`);
      console.log(`   Last month: ${initialStats.byAge.lastMonth}`);
      console.log(`   Older than month: ${initialStats.byAge.olderThanMonth}`);
    }
    
    // Show what would be deleted
    console.log('\n🔍 [TEST] Checking notifications that would be deleted...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldNotifications = await admindb.find({
      createdAt: { $lt: thirtyDaysAgo }
    })
    .select('userid message seen createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();
    
    const totalOldCount = await admindb.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`   Found ${totalOldCount} notifications older than 30 days`);
    console.log(`   Cutoff date: ${thirtyDaysAgo.toISOString()}`);
    
    if (oldNotifications.length > 0) {
      console.log('\n📋 [TEST] Sample notifications that would be deleted:');
      oldNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.message} (${notif.seen ? 'read' : 'unread'}) - ${notif.createdAt.toISOString()}`);
      });
    }
    
    // Ask user if they want to proceed with actual cleanup
    console.log('\n⚠️ [TEST] This will actually delete old notifications!');
    console.log('   If you want to proceed, uncomment the cleanup section below.');
    
    // Uncomment the following lines to actually run the cleanup
    /*
    console.log('\n🧹 [TEST] Running actual cleanup...');
    const result = await cleanupOldNotifications();
    
    if (result.success) {
      console.log(`✅ [TEST] Cleanup completed: ${result.message}`);
      console.log(`   Deleted: ${result.deletedCount} notifications`);
      console.log(`   Remaining: ${result.remainingCount} notifications`);
    } else {
      console.error(`❌ [TEST] Cleanup failed: ${result.message}`);
    }
    
    // Get final stats
    console.log('\n📊 [TEST] Final notification statistics:');
    const finalStats = await getNotificationStats();
    if (finalStats) {
      console.log(`   Total: ${finalStats.total}`);
      console.log(`   Unread: ${finalStats.unread}`);
      console.log(`   Read: ${finalStats.read}`);
      console.log(`   Last 24h: ${finalStats.byAge.last24Hours}`);
      console.log(`   Last week: ${finalStats.byAge.lastWeek}`);
      console.log(`   Last month: ${finalStats.byAge.lastMonth}`);
      console.log(`   Older than month: ${finalStats.byAge.olderThanMonth}`);
    }
    */
    
    console.log('\n✅ [TEST] Test completed successfully');
    console.log('   To run actual cleanup, uncomment the cleanup section in this script');
    
  } catch (error) {
    console.error('❌ [TEST] Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the test if this script is executed directly
if (require.main === module) {
  testNotificationCleanup();
}

module.exports = { testNotificationCleanup };
