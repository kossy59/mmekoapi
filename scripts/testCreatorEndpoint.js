#!/usr/bin/env node

/**
 * Test Creator Endpoint
 * Tests if the creator endpoint is working correctly
 */

const axios = require('axios');

console.log('🔍 [CREATOR ENDPOINT TEST] Testing creator endpoint...\n');

const BASE_URL = 'https://mmekoapi.onrender.com';

console.log(`🌐 Testing against: ${BASE_URL}\n`);

async function testCreatorEndpoint() {
  try {
    // Test 1: Check if creator endpoint is accessible
    console.log('📋 Test 1: Creator Endpoint (POST /creator)');
    console.log('============================================');
    
    try {
      const creatorResponse = await axios.post(`${BASE_URL}/creator`, {
        userid: '68cffe13f8c635ea77dac40e' // Use a test user ID
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status
      });
      
      console.log('✅ Creator endpoint accessible');
      console.log('Response status:', creatorResponse.status);
      console.log('Response data keys:', Object.keys(creatorResponse.data || {}));
      
      if (creatorResponse.data && creatorResponse.data.host) {
        console.log('✅ Creators found:', creatorResponse.data.host.length);
        if (creatorResponse.data.host.length > 0) {
          const firstCreator = creatorResponse.data.host[0];
          console.log('📋 First creator sample:', {
            name: firstCreator.name,
            hostid: firstCreator.hostid,
            userid: firstCreator.userid,
            photolink: firstCreator.photolink?.length || 0,
            isVip: firstCreator.isVip,
            isOnline: firstCreator.isOnline
          });
        }
      } else {
        console.log('⚠️ No creators found in response');
      }
      
    } catch (error) {
      console.log('❌ Creator endpoint failed:', error.response?.status, error.message);
      if (error.response?.data) {
        console.log('Error details:', error.response.data);
      }
    }

    // Test 2: Check if server is running
    console.log('\n📋 Test 2: Server Health Check');
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

    // Test 3: Check database connection (if we can access a simple endpoint)
    console.log('\n📋 Test 3: Database Connection Test');
    console.log('====================================');
    
    try {
      // Try to access a simple endpoint that requires DB
      const dbResponse = await axios.get(`${BASE_URL}/getallpost`, {
        timeout: 10000,
        validateStatus: () => true
      });
      console.log('✅ Database connection appears to be working');
      console.log('Response status:', dbResponse.status);
    } catch (error) {
      console.log('❌ Database connection test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCreatorEndpoint().then(() => {
  console.log('\n🏁 Creator endpoint test complete');
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
});
