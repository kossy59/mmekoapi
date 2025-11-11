const cron = require('node-cron');
const { performPureNodeBackup } = require('./pureNodeBackup');

// Hardcoded backup schedule: Daily at 2:00 AM (Africa/Lagos time)
const BACKUP_CRON_SCHEDULE = '0 2 * * *'; // 2:00 AM daily
const BACKUP_TIMEZONE = 'Africa/Lagos';

/**
 * Setup MongoDB backup cron job
 * Runs daily at 2:00 AM (Africa/Lagos time)
 */
function setupBackupCron() {
  console.log(`🕐 [BACKUP] Scheduling cron job -> "${BACKUP_CRON_SCHEDULE}" (${BACKUP_TIMEZONE})`);

  const backupTask = cron.schedule(BACKUP_CRON_SCHEDULE, async () => {
    const startedAt = new Date();
    console.log(`🗄️ [BACKUP] Cron triggered at ${startedAt.toISOString()}`);

    try {
      const result = await performPureNodeBackup();

      if (result?.success) {
        console.log(`✅ [BACKUP] Completed ${result.backupName} in ${result.duration ?? 'unknown'}s`);
      } else {
        const errorMessage = result?.error || 'Unknown error';
        console.error(`❌ [BACKUP] Backup reported failure: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ [BACKUP] Backup error:', error.message);
    }
  }, {
    scheduled: true,
    timezone: BACKUP_TIMEZONE
  });

  backupTask.start();
  console.log('✅ [BACKUP] Cron job started');

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