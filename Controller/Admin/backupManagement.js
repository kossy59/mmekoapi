const { performPureNodeBackup, listBackups, cleanupOldBackups } = require('../../scripts/pureNodeBackup');
const { triggerManualBackup } = require('../../scripts/setupBackupCron');
const { addBackupRecord, getBackupHistory: getLocalBackupHistory, cleanupOldBackupRecords, getBackupStats: getLocalBackupStats } = require('../../scripts/backupTracker');

/**
 * Get backup history and status
 */
const getBackupStatus = async (req, res) => {
  try {
    
    // Use local backup tracker instead of Storj listing
    const backupHistory = getLocalBackupHistory();
    
    // Calculate total size
    const totalSize = backupHistory.reduce((sum, backup) => sum + backup.size, 0);
    
    // Get latest backup info
    const latestBackup = backupHistory.length > 0 ? backupHistory[0] : null;
    
    // Calculate days since last backup
    let daysSinceLastBackup = null;
    if (latestBackup) {
      const lastBackupDate = new Date(latestBackup.lastModified);
      const now = new Date();
      daysSinceLastBackup = Math.floor((now - lastBackupDate) / (1000 * 60 * 60 * 24));
    }
    
    // Map backup history to match frontend expectations
    const mappedHistory = backupHistory.map(backup => ({
      name: backup.fileName,
      size: backup.size,
      lastModified: backup.lastModified,
      date: backup.date,
      status: backup.status,
      location: backup.location
    }));

    const status = {
      success: true,
      totalBackups: backupHistory.length,
      totalSize: totalSize,
      latestBackup: latestBackup ? {
        name: latestBackup.fileName,
        size: latestBackup.size,
        lastModified: latestBackup.lastModified,
        date: latestBackup.date
      } : null,
      daysSinceLastBackup: daysSinceLastBackup,
      history: mappedHistory,
      lastChecked: new Date().toISOString()
    };
    
    res.status(200).json(status);
    
  } catch (error) {
    console.error('[Backup Admin] Error fetching backup status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup status',
      error: error.message
    });
  }
};

/**
 * Trigger manual backup
 */
const triggerBackup = async (req, res) => {
  try {
    console.log('[Backup Admin] Triggering manual backup...');
    
    const result = await triggerManualBackup();
    
    if (result.success) {
      console.log('[Backup Admin] Manual backup completed successfully');
      res.status(200).json({
        success: true,
        message: 'Backup completed successfully',
        data: {
          backupName: result.backupName,
          size: result.size,
          duration: result.duration,
          deletedOldBackups: result.deletedOldBackups,
          timestamp: result.timestamp
        }
      });
    } else {
      console.error('[Backup Admin] Manual backup failed:', result.error);
      res.status(500).json({
        success: false,
        message: 'Backup failed',
        error: result.error,
        timestamp: result.timestamp
      });
    }
    
  } catch (error) {
    console.error('[Backup Admin] Error triggering backup:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger backup',
      error: error.message
    });
  }
};

/**
 * Clean up old backups manually
 */
const cleanupBackups = async (req, res) => {
  try {
    console.log('[Backup Admin] Triggering manual cleanup...');
    
    const deletedCount = cleanupOldBackupRecords();
    
    console.log(`[Backup Admin] Cleanup completed, deleted ${deletedCount} old backups`);
    res.status(200).json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedCount: deletedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Backup Admin] Error during cleanup:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old backups',
      error: error.message
    });
  }
};

/**
 * Get backup statistics
 */
const getBackupStats = async (req, res) => {
  try {
    console.log('[Backup Admin] Fetching backup statistics...');
    
    // Use local backup tracker for statistics
    const stats = getLocalBackupStats();
    
    console.log('[Backup Admin] Backup statistics retrieved successfully');
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('[Backup Admin] Error fetching backup statistics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup statistics',
      error: error.message
    });
  }
};

module.exports = {
  getBackupStatus,
  triggerBackup,
  cleanupBackups,
  getBackupStats
};
