const cron = require('node-cron');
const { performPureNodeBackup } = require('./pureNodeBackup');

/**
 * Setup MongoDB backup cron job
 * Runs every day at 12:30 PM Nigeria time
 */
function setupBackupCron() {
  // Schedule backup to run every day at 12:30 PM Nigeria time
  const backupTask = cron.schedule('30 12 * * *', async () => {
    try {
      await performPureNodeBackup();
    } catch (error) {
      console.error('Backup error:', error.message);
    }
    
  }, {
    scheduled: true, // Start automatically
    timezone: "Africa/Lagos" // Use Nigeria timezone
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
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test function to trigger backup immediately (for testing)
 */
async function testBackupNow() {
  try {
    const result = await triggerManualBackup();
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  setupBackupCron,
  triggerManualBackup,
  testBackupNow
};