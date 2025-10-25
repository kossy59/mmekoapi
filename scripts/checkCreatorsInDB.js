#!/usr/bin/env node

/**
 * Check Creators in Database
 * Directly queries the database to see if creators exist
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import the creator model
const Creator = require('../Creators/creators');

async function checkCreatorsInDB() {
  try {
    console.log('🔍 [DB CREATORS CHECK] Checking creators in database...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko');
    console.log('✅ Connected to database');
    
    // Count total creators
    const totalCreators = await Creator.countDocuments();
    console.log(`📊 Total creators in database: ${totalCreators}`);
    
    if (totalCreators > 0) {
      // Get first few creators
      const creators = await Creator.find().limit(3).lean();
      console.log('\n📄 Sample creators:');
      console.log('==================');
      
      creators.forEach((creator, index) => {
        console.log(`\nCreator ${index + 1}:`);
        console.log('_id:', creator._id);
        console.log('name:', creator.name);
        console.log('userid:', creator.userid);
        console.log('verify:', creator.verify);
        console.log('Keys:', Object.keys(creator));
      });
      
      // Check if any creators have the specific userid
      const userCreators = await Creator.find({ userid: '68cffe13f8c635ea77dac40e' });
      console.log(`\n👤 Creators for user 68cffe13f8c635ea77dac40e: ${userCreators.length}`);
      
      if (userCreators.length > 0) {
        console.log('User creators:');
        userCreators.forEach((creator, index) => {
          console.log(`Creator ${index + 1}:`, {
            _id: creator._id,
            name: creator.name,
            userid: creator.userid
          });
        });
      }
      
    } else {
      console.log('❌ No creators found in database');
    }
    
  } catch (error) {
    console.log('❌ Error checking creators:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

checkCreatorsInDB();
