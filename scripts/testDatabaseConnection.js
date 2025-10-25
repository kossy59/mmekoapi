#!/usr/bin/env node

/**
 * Test Database Connection
 * Tests if the database connection is working
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testDatabaseConnection() {
  try {
    console.log('🔍 [DB CONNECTION TEST] Testing database connection...\n');
    
    // Get the MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';
    console.log('MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    // Connect to database
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Available collections:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check if creators collection exists
    const creatorsCollection = collections.find(col => col.name === 'creators');
    if (creatorsCollection) {
      console.log('\n✅ Creators collection exists');
      
      // Count documents in creators collection
      const count = await mongoose.connection.db.collection('creators').countDocuments();
      console.log(`📊 Documents in creators collection: ${count}`);
      
      if (count > 0) {
        // Get one sample document
        const sample = await mongoose.connection.db.collection('creators').findOne();
        console.log('\n📄 Sample creator document:');
        console.log('Keys:', Object.keys(sample));
        console.log('_id:', sample._id);
        console.log('name:', sample.name);
        console.log('userid:', sample.userid);
      }
    } else {
      console.log('\n❌ Creators collection does not exist');
    }
    
  } catch (error) {
    console.log('❌ Error connecting to database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

testDatabaseConnection();
