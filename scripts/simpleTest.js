#!/usr/bin/env node

/**
 * Simple Test Script
 * This script tests the backup without complex date formatting
 */

const { performPureNodeBackup } = require('./pureNodeBackup');

async function simpleTest() {
  console.log('🧪 Simple Backup Test...');
  console.log('⏰ Current time:', new Date().toString());
  console.log('');
  
  try {
    console.log('🚀 Starting backup...');
    const result = await performPureNodeBackup();
    
    console.log('📊 Backup result:', result);
    
    if (result.success) {
      console.log('✅ Backup completed successfully!');
    } else {
      console.log('❌ Backup failed:', result.error);
    }
    
  } catch (error) {
    console.log('💥 Backup crashed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  simpleTest();
}

module.exports = { simpleTest };
