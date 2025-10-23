#!/usr/bin/env node

/**
 * Test Backup Script
 * This script allows you to test the backup functionality immediately
 */

const { testBackupNow } = require('./setupBackupCron');

async function main() {
  try {
    const result = await testBackupNow();
    
    if (result.success) {
      console.log('✅ Test backup completed successfully!');
    } else {
      console.log('❌ Test backup failed!');
      console.error('Error:', result.error);
    }
    
  } catch (error) {
    console.log('💥 Test backup crashed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
