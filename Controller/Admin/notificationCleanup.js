const { cleanupOldNotifications, getNotificationStats } = require('../../scripts/cleanupOldNotifications');

/**
 * Manual cleanup of old notifications
 * DELETE /api/admin/notifications/cleanup
 */
const manualCleanup = async (req, res) => {
  try {
    console.log('🧹 [ADMIN API] Manual notification cleanup requested');
    
    const result = await cleanupOldNotifications();
    
    if (result.success) {
      console.log(`✅ [ADMIN API] Manual cleanup completed: ${result.message}`);
      return res.status(200).json({
        ok: true,
        message: result.message,
        deletedCount: result.deletedCount,
        remainingCount: result.remainingCount
      });
    } else {
      console.error(`❌ [ADMIN API] Manual cleanup failed: ${result.message}`);
      return res.status(500).json({
        ok: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ [ADMIN API] Error in manual cleanup:', error);
    return res.status(500).json({
      ok: false,
      message: 'Failed to cleanup notifications',
      error: error.message
    });
  }
};

/**
 * Get notification statistics
 * GET /api/admin/notifications/stats
 */
const getStats = async (req, res) => {
  try {
    console.log('📊 [ADMIN API] Notification stats requested');
    
    const stats = await getNotificationStats();
    
    if (stats) {
      console.log('✅ [ADMIN API] Stats retrieved successfully');
      return res.status(200).json({
        ok: true,
        message: 'Notification statistics retrieved successfully',
        stats: {
          total: stats.total,
          unread: stats.unread,
          read: stats.read,
          byAge: {
            last24Hours: stats.byAge.last24Hours,
            lastWeek: stats.byAge.lastWeek,
            lastMonth: stats.byAge.lastMonth,
            olderThanMonth: stats.byAge.olderThanMonth
          }
        }
      });
    } else {
      console.error('❌ [ADMIN API] Failed to get stats');
      return res.status(500).json({
        ok: false,
        message: 'Failed to retrieve notification statistics'
      });
    }
  } catch (error) {
    console.error('❌ [ADMIN API] Error getting stats:', error);
    return res.status(500).json({
      ok: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
};

/**
 * Get notifications that would be deleted in next cleanup
 * GET /api/admin/notifications/cleanup-preview
 */
const getCleanupPreview = async (req, res) => {
  try {
    console.log('🔍 [ADMIN API] Cleanup preview requested');
    
    const admindb = require('../../Creators/admindb');
    
    // Calculate the cutoff date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find notifications that would be deleted
    const oldNotifications = await admindb.find({
      createdAt: { $lt: thirtyDaysAgo }
    })
    .select('userid message seen createdAt')
    .sort({ createdAt: -1 })
    .limit(50) // Limit to 50 for preview
    .exec();
    
    const totalOldCount = await admindb.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`✅ [ADMIN API] Cleanup preview: ${totalOldCount} notifications would be deleted`);
    
    return res.status(200).json({
      ok: true,
      message: `Found ${totalOldCount} notifications older than 30 days`,
      totalOldCount,
      preview: oldNotifications.map(notif => ({
        id: notif._id,
        userid: notif.userid,
        message: notif.message,
        seen: notif.seen,
        createdAt: notif.createdAt
      })),
      cutoffDate: thirtyDaysAgo
    });
  } catch (error) {
    console.error('❌ [ADMIN API] Error getting cleanup preview:', error);
    return res.status(500).json({
      ok: false,
      message: 'Failed to get cleanup preview',
      error: error.message
    });
  }
};

module.exports = {
  manualCleanup,
  getStats,
  getCleanupPreview
};
