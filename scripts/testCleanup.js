#!/usr/bin/env node

/**
 * Test script for the orphaned pending balance cleanup system
 * This script creates test data and verifies the cleanup works correctly
 */

const mongoose = require('mongoose');
const requestdb = require('../Creators/requsts');
const userdb = require('../Creators/userdb');
const creatordb = require('../Creators/creators');
const { cleanupOrphanedPendingBalances, getPendingBalanceStats } = require('./cleanupOrphanedPendingBalances');

async function createTestData() {
  console.log("Creating test data...");
  
  try {
    // Create a test user
    const testUser = await userdb.create({
      firstname: "Test",
      lastname: "User",
      gender: "Male",
      password: "test123",
      active: true,
      country: "US",
      age: "25",
      admin: false,
      balance: "100.00",
      pending: "0"
    });
    
    // Create a test creator
    const testCreator = await creatordb.create({
      userid: testUser._id.toString(),
      name: "Test Creator",
      price: "50.00",
      hosttype: "Fan meet"
    });
    
    // Create a test request
    const testRequest = await requestdb.create({
      userid: testUser._id.toString(),
      creator_portfolio_id: testCreator._id.toString(),
      type: "Fan meet",
      place: "Test Location",
      time: "10:00",
      date: "2024-12-25",
      status: "request",
      price: 50.00
    });
    
    // Update user balance to simulate pending
    testUser.balance = "50.00";
    testUser.pending = "50.00";
    await testUser.save();
    
    console.log("Test data created:");
    console.log(`- User ID: ${testUser._id}`);
    console.log(`- Creator ID: ${testCreator._id}`);
    console.log(`- Request ID: ${testRequest._id}`);
    console.log(`- User balance: ${testUser.balance}, pending: ${testUser.pending}`);
    
    return { testUser, testCreator, testRequest };
    
  } catch (error) {
    console.error("Error creating test data:", error);
    throw error;
  }
}

async function testCleanup() {
  try {
    console.log("Testing Orphaned Pending Balance Cleanup");
    console.log("=====================================");
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';
    await mongoose.connect(mongoUri);
    console.log("Connected to database");
    
    // Create test data
    const { testUser, testCreator, testRequest } = await createTestData();
    
    // Get initial stats
    console.log("\nInitial statistics:");
    const initialStats = await getPendingBalanceStats();
    console.log(initialStats);
    
    // Delete the creator portfolio (simulate portfolio deletion)
    console.log("\nDeleting creator portfolio...");
    await creatordb.deleteOne({ _id: testCreator._id });
    console.log("Creator portfolio deleted");
    
    // Get stats after portfolio deletion
    console.log("\nStatistics after portfolio deletion:");
    const afterDeletionStats = await getPendingBalanceStats();
    console.log(afterDeletionStats);
    
    // Run cleanup
    console.log("\nRunning cleanup...");
    const cleanupResult = await cleanupOrphanedPendingBalances();
    console.log("Cleanup result:", cleanupResult);
    
    // Get final stats
    console.log("\nFinal statistics:");
    const finalStats = await getPendingBalanceStats();
    console.log(finalStats);
    
    // Verify user balance was refunded
    const updatedUser = await userdb.findById(testUser._id);
    console.log(`\nUser balance after cleanup: ${updatedUser.balance}, pending: ${updatedUser.pending}`);
    
    // Verify request status was updated
    const updatedRequest = await requestdb.findById(testRequest._id);
    console.log(`Request status after cleanup: ${updatedRequest.status}`);
    
    // Clean up test data
    console.log("\nCleaning up test data...");
    await requestdb.deleteOne({ _id: testRequest._id });
    await userdb.deleteOne({ _id: testUser._id });
    console.log("Test data cleaned up");
    
    console.log("\n✅ Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the test
testCleanup().catch(console.error);
