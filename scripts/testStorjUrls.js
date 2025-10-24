#!/usr/bin/env node

/**
 * Test Storj URL Generation
 * Tests if Storj URLs are being generated correctly
 */

require('dotenv').config();
const { getFileUrl, uploadSingleFileToCloudinary } = require('../utiils/storj');

console.log('🔍 [STORJ URL TEST] Testing Storj URL generation...\n');

// Test URL generation
console.log('📋 Testing URL Generation:');
console.log('==========================');

const testCases = [
  { bucket: 'post', key: 'test-image.jpg' },
  { bucket: 'profile', key: 'profile-pic.png' },
  { bucket: 'creator', key: 'creator-portfolio.jpg' }
];

testCases.forEach(({ bucket, key }) => {
  const url = getFileUrl(bucket, key);
  console.log(`✅ ${bucket}/${key} → ${url}`);
});

console.log('\n🔧 Environment Check:');
console.log('=====================');

console.log('STORJ_ENDPOINT:', process.env.STORJ_ENDPOINT);
console.log('STORJ_BUCKET_POST:', process.env.STORJ_BUCKET_POST);
console.log('STORJ_BUCKET_PROFILE:', process.env.STORJ_BUCKET_PROFILE);
console.log('STORJ_BUCKET_CREATOR:', process.env.STORJ_BUCKET_CREATOR);

console.log('\n🏁 URL generation test complete');
