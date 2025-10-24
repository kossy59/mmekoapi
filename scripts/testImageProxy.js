#!/usr/bin/env node

/**
 * Test Image Proxy Endpoints
 * Tests if the image proxy routes are working correctly
 */

const axios = require('axios');

console.log('🔍 [IMAGE PROXY TEST] Testing image proxy endpoints...\n');

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mmekoapi.onrender.com' 
  : 'http://localhost:3100';

console.log(`🌐 Testing against: ${BASE_URL}\n`);

async function testImageProxy() {
  try {
    // Test 1: Check if image info endpoint is accessible
    console.log('📋 Test 1: Image Info Endpoint');
    console.log('===============================');
    
    try {
      const infoResponse = await axios.get(`${BASE_URL}/api/image/info?publicId=test`);
      console.log('✅ Image info endpoint accessible');
      console.log('Response:', infoResponse.status);
    } catch (error) {
      console.log('❌ Image info endpoint failed:', error.response?.status, error.message);
    }

    // Test 2: Check if image view endpoint is accessible
    console.log('\n📋 Test 2: Image View Endpoint');
    console.log('===============================');
    
    try {
      const viewResponse = await axios.get(`${BASE_URL}/api/image/view?publicId=test`, {
        validateStatus: () => true // Don't throw on 404
      });
      console.log('✅ Image view endpoint accessible');
      console.log('Response status:', viewResponse.status);
    } catch (error) {
      console.log('❌ Image view endpoint failed:', error.message);
    }

    // Test 3: Check if server is running
    console.log('\n📋 Test 3: Server Health Check');
    console.log('===============================');
    
    try {
      const healthResponse = await axios.get(`${BASE_URL}/`, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log('✅ Server is running');
      console.log('Response status:', healthResponse.status);
    } catch (error) {
      console.log('❌ Server not accessible:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testImageProxy().then(() => {
  console.log('\n🏁 Image proxy test complete');
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
});
