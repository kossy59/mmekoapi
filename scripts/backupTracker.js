const fs = require('fs');
const path = require('path');

// Local backup tracking file
const BACKUP_TRACKER_FILE = path.join(__dirname, '../backups/backup_tracker.json');

/**
 * Initialize backup tracker
 */
function initBackupTracker() {
  if (!fs.existsSync(BACKUP_TRACKER_FILE)) {
    const initialData = {
      backups: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(BACKUP_TRACKER_FILE, JSON.stringify(initialData, null, 2));
  }
}

/**
 * Add a backup record
 */
function addBackupRecord(backupInfo) {
  initBackupTracker();
  
  try {
    const data = JSON.parse(fs.readFileSync(BACKUP_TRACKER_FILE, 'utf8'));
    
    const backupRecord = {
      id: Date.now().toString(),
      fileName: backupInfo.fileName,
      size: backupInfo.size,
      date: backupInfo.date,
      lastModified: new Date().toISOString(),
      status: 'completed',
      location: backupInfo.location
    };
    
    data.backups.unshift(backupRecord); // Add to beginning
    data.lastUpdated = new Date().toISOString();
    
    // Keep only last 50 backups in tracker
    if (data.backups.length > 50) {
      data.backups = data.backups.slice(0, 50);
    }
    
    fs.writeFileSync(BACKUP_TRACKER_FILE, JSON.stringify(data, null, 2));
    
    return backupRecord;
  } catch (error) {
    console.error('[Backup Tracker] Error adding backup record:', error.message);
    return null;
  }
}

/**
 * Get backup history from local tracker
 */
function getBackupHistory() {
  initBackupTracker();
  
  try {
    const data = JSON.parse(fs.readFileSync(BACKUP_TRACKER_FILE, 'utf8'));
    return data.backups;
  } catch (error) {
    console.error('[Backup Tracker] Error reading backup history:', error.message);
    return [];
  }
}

/**
 * Clean up old backup records (older than 31 days)
 */
function cleanupOldBackupRecords() {
  initBackupTracker();
  
  try {
    const data = JSON.parse(fs.readFileSync(BACKUP_TRACKER_FILE, 'utf8'));
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    
    const originalCount = data.backups.length;
    data.backups = data.backups.filter(backup => {
      const backupDate = new Date(backup.lastModified);
      return backupDate >= thirtyOneDaysAgo;
    });
    
    const deletedCount = originalCount - data.backups.length;
    data.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(BACKUP_TRACKER_FILE, JSON.stringify(data, null, 2));
    
    if (deletedCount > 0) {
    }
    
    return deletedCount;
  } catch (error) {
    console.error('[Backup Tracker] Error cleaning up backup records:', error.message);
    return 0;
  }
}

/**
 * Get backup statistics
 */
function getBackupStats() {
  const backups = getBackupHistory();
  
  if (backups.length === 0) {
    return {
      totalBackups: 0,
      totalSize: 0,
      averageSize: 0,
      monthlyStats: {},
      sizeDistribution: { small: 0, medium: 0, large: 0 },
      lastUpdated: new Date().toISOString()
    };
  }
  
  const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
  const averageSize = totalSize / backups.length;
  
  // Monthly statistics
  const monthlyStats = {};
  backups.forEach(backup => {
    const month = backup.date.substring(0, 7); // YYYY-MM
    if (!monthlyStats[month]) {
      monthlyStats[month] = { count: 0, size: 0 };
    }
    monthlyStats[month].count++;
    monthlyStats[month].size += backup.size || 0;
  });
  
  // Size distribution
  const sizeDistribution = { small: 0, medium: 0, large: 0 };
  backups.forEach(backup => {
    const size = backup.size || 0;
    if (size < 10 * 1024 * 1024) { // < 10MB
      sizeDistribution.small++;
    } else if (size < 100 * 1024 * 1024) { // 10MB - 100MB
      sizeDistribution.medium++;
    } else { // > 100MB
      sizeDistribution.large++;
    }
  });
  
  return {
    totalBackups: backups.length,
    totalSize: totalSize,
    averageSize: averageSize,
    monthlyStats: monthlyStats,
    sizeDistribution: sizeDistribution,
    lastUpdated: new Date().toISOString()
  };
}

module.exports = {
  initBackupTracker,
  addBackupRecord,
  getBackupHistory,
  cleanupOldBackupRecords,
  getBackupStats
};
