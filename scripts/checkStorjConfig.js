#!/usr/bin/env node

/**
 * Storj Configuration Diagnostic Script
 * Checks if Storj environment variables are properly configured
 */

require('dotenv').config();

console.log('🔍 [STORJ DIAGNOSTIC] Checking Storj configuration...\n');

// Check required environment variables
const requiredVars = [
  'STORJ_ACCESS_KEY_ID',
  'STORJ_SECRET_ACCESS_KEY', 
  'STORJ_ENDPOINT',
  'STORJ_BUCKET_POST',
  'STORJ_BUCKET_PROFILE',
  'STORJ_BUCKET_CREATOR'
];

let allConfigured = true;

console.log('📋 Environment Variables Status:');
console.log('================================');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (varName.includes('KEY') ? '***HIDDEN***' : value) : 'NOT SET';
  
  console.log(`${status} ${varName}: ${displayValue}`);
  
  if (!value) {
    allConfigured = false;
  }
});

console.log('\n🔧 Configuration Summary:');
console.log('========================');

if (allConfigured) {
  console.log('✅ All required Storj environment variables are configured');
} else {
  console.log('❌ Some Storj environment variables are missing');
  console.log('\n📝 Required variables:');
  requiredVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

// Test Storj connection
console.log('\n🌐 Testing Storj Connection:');
console.log('============================');

try {
  const AWS = require('aws-sdk');
  
  const s3Client = new AWS.S3({
    endpoint: process.env.STORJ_ENDPOINT,
    region: 'us-east-1',
    accessKeyId: process.env.STORJ_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORJ_SECRET_ACCESS_KEY,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });

  // Test connection by listing buckets
  s3Client.listBuckets((err, data) => {
    if (err) {
      console.log('❌ Storj connection failed:', err.message);
    } else {
      console.log('✅ Storj connection successful');
      console.log('📦 Available buckets:', data.Buckets.map(b => b.Name).join(', '));
    }
  });
  
} catch (error) {
  console.log('❌ Failed to initialize Storj client:', error.message);
}

console.log('\n🏁 Diagnostic complete');
