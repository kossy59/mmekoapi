#!/usr/bin/env node

/**
 * Test Production Creators Response
 * Tests the exact response structure from production backend
 */

const axios = require('axios');

console.log('🔍 [PRODUCTION CREATORS TEST] Testing production creators response...\n');

const BASE_URL = 'https://mmekoapi.onrender.com';

async function testProductionCreators() {
  try {
    console.log('📋 Testing Production Creators Response:');
    console.log('=========================================');
    
    const creatorResponse = await axios.post(`${BASE_URL}/creator`, {
      userid: '68cffe13f8c635ea77dac40e'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log('✅ Creator endpoint response received');
    console.log('Status:', creatorResponse.status);
    console.log('Response structure:');
    console.log('===================');
    console.log('ok:', creatorResponse.data.ok);
    console.log('message:', creatorResponse.data.message);
    console.log('host type:', typeof creatorResponse.data.host);
    console.log('host length:', Array.isArray(creatorResponse.data.host) ? creatorResponse.data.host.length : 'not an array');
    
    if (creatorResponse.data.host && Array.isArray(creatorResponse.data.host)) {
      console.log('\n📄 Host array contents:');
      console.log('======================');
      creatorResponse.data.host.forEach((creator, index) => {
        console.log(`\nCreator ${index + 1}:`);
        console.log('hostid:', creator.hostid);
        console.log('_id:', creator._id);
        console.log('name:', creator.name);
        console.log('userid:', creator.userid);
        console.log('Keys:', Object.keys(creator));
      });
    } else {
      console.log('\n❌ Host is not an array or is empty');
      console.log('Host value:', creatorResponse.data.host);
    }
    
    console.log('\n🔍 Full response:');
    console.log('================');
    console.log(JSON.stringify(creatorResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error testing production creators:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testProductionCreators();
