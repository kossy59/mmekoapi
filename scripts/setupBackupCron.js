const cron = require('node-cron');
const { performPureNodeBackup } = require('./pureNodeBackup');

/**
 * Setup MongoDB backup cron job
 * Runs every day at 00:00 (midnight UTC)
 */
function setupBackupCron() {
  
  // Schedule backup to run every day at 00:00 (midnight UTC)
  const backupTask = cron.schedule('0 0 * * *', async () => {
    const startTime = new Date();
    
    try {
      const result = await performPureNodeBackup();
      
      if (result.success) {
      } else {
        console.error('[Cron] Scheduled backup failed:', result.error);
      }
      
    } catch (error) {
      console.error('[Cron] Scheduled backup error:', error.message);
    }
    
  }, {
    scheduled: true, // Start automatically
    timezone: "UTC"
  });
  
  // Start the cron job
  backupTask.start();
  
  
  return backupTask;
}

/**
 * Manual backup trigger (for testing or on-demand backups)
 */
async function triggerManualBackup() {
  
  try {
    const result = await performPureNodeBackup();
    
    if (result.success) {
    } else {
      console.error('[Manual Backup] Manual backup failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('[Manual Backup] Manual backup error:', error.message);
    throw error;
  }
}

module.exports = {
  setupBackupCron,
  triggerManualBackup
};
