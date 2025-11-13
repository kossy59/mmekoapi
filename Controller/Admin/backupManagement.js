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
    // Also extract fileName from location if fileName is missing
    let mappedHistory = backupHistory.map(backup => {
      // Extract filename from location if fileName is missing
      let fileName = backup.fileName;
      if (!fileName && backup.location) {
        // Extract filename from URL like: https://gateway.storjshare.io/database-backup/backup_2025-10-25.bson.gz
        const urlParts = backup.location.split('/');
        fileName = urlParts[urlParts.length - 1] || 'unknown';
      }
      if (!fileName) {
        fileName = `backup_${backup.date || 'unknown'}.bson.gz`;
      }
      
      return {
        name: fileName,
        size: backup.size || 0,
        lastModified: backup.lastModified,
        date: backup.date || (backup.lastModified ? backup.lastModified.split('T')[0] : 'unknown'),
        status: backup.status || 'unknown',
        location: backup.location,
        error: backup.error || null
      };
    });
    
    // Sort by lastModified descending (most recent first)
    mappedHistory.sort((a, b) => {
      const dateA = new Date(a.lastModified);
      const dateB = new Date(b.lastModified);
      return dateB - dateA;
    });
    
    const failedBackups = mappedHistory.filter(backup => backup.status === 'failed');

    const status = {
      success: true,
      totalBackups: backupHistory.length,
      totalSize: totalSize,
      latestBackup: latestBackup ? {
        name: latestBackup.fileName,
        size: latestBackup.size,
        lastModified: latestBackup.lastModified,
        date: latestBackup.date,
        status: latestBackup.status,
        error: latestBackup.error || null
      } : null,
      daysSinceLastBackup: daysSinceLastBackup,
      history: mappedHistory,
      failedBackups: failedBackups.length,
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
 * Clean up old backups manually (from Storj and tracker)
 */
const cleanupBackups = async (req, res) => {
  try {
    console.log('[Backup Admin] Triggering manual cleanup...');
    
    // Cleanup from Storj and tracker
    const deletedCount = await cleanupOldBackups();
    
    console.log(`[Backup Admin] Cleanup completed, deleted ${deletedCount} old backup(s) from Storj`);
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
