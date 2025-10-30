#!/usr/bin/env node

/**
 * Test Creator Data Response
 * Tests what data the backend actually returns for creators
 */

const axios = require('axios');

console.log('🔍 [CREATOR DATA TEST] Testing creator data response...\n');

const BASE_URL = 'https://backendritual.work';

async function testCreatorData() {
  try {
    console.log('📋 Testing Creator Data Response:');
    console.log('================================');
    
    const creatorResponse = await axios.post(`${BASE_URL}/creator`, {
      userid: '68cffe13f8c635ea77dac40e'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('✅ Creator endpoint response received');
    console.log('Status:', creatorResponse.status);
    console.log('Response data structure:');
    
    if (creatorResponse.data && creatorResponse.data.length > 0) {
      const firstCreator = creatorResponse.data[0];
      console.log('\n📄 First creator data structure:');
      console.log('================================');
      console.log('Keys:', Object.keys(firstCreator));
      console.log('\nField values:');
      console.log('hostid:', firstCreator.hostid);
      console.log('_id:', firstCreator._id);
      console.log('id:', firstCreator.id);
      console.log('creator_portfolio_id:', firstCreator.creator_portfolio_id);
      console.log('userid:', firstCreator.userid);
      console.log('name:', firstCreator.name);
      
      console.log('\n🔍 Full first creator object:');
      console.log(JSON.stringify(firstCreator, null, 2));
    } else {
      console.log('❌ No creators returned');
    }
    
  } catch (error) {
    console.log('❌ Error testing creator data:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testCreatorData();
