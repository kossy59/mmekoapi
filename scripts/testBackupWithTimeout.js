#!/usr/bin/env node

/**
 * Test Backup with Timeout
 * This script tests the backup with timeout handling
 */

const { performPureNodeBackup } = require('./pureNodeBackup');

async function testWithTimeout() {
  console.log('🧪 Testing MongoDB Backup with timeout...');
  console.log('⏰ Current time:', new Date().toString());
  console.log('');
  
  // Set a timeout for the backup process
  const timeoutMs = 30000; // 30 seconds timeout
  let timeoutId;
  
  try {
    console.log('🚀 Starting backup with 30-second timeout...');
    
    const backupPromise = performPureNodeBackup();
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Backup timed out after ${timeoutMs/1000} seconds`));
      }, timeoutMs);
    });
    
    const result = await Promise.race([backupPromise, timeoutPromise]);
    
    clearTimeout(timeoutId);
    
    console.log('📊 Backup result:', result);
    
    if (result.success) {
      console.log('✅ Backup completed successfully!');
    } else {
      console.log('❌ Backup failed:', result.error);
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.message.includes('timed out')) {
      console.log('⏰ Backup timed out after 30 seconds');
      console.log('💡 This might indicate:');
      console.log('   - Database is very large');
      console.log('   - Network connection issues');
      console.log('   - MongoDB connection problems');
    } else {
      console.log('💥 Backup crashed!');
      console.error('Error:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  testWithTimeout();
}

module.exports = { testWithTimeout };
