#!/usr/bin/env node

/**
 * Test script to simulate portfolio deletion and check if refunds work
 */

const mongoose = require('mongoose');

async function testPortfolioDeletion() {
  try {
    console.log("🧪 Testing Portfolio Deletion Refund");
    console.log("====================================");
    
    // Connect to database using your online DB
    require('dotenv').config();
    const mongoUri = process.env.DB;
    
    if (!mongoUri) {
      throw new Error('Missing DB connection string in environment variables (process.env.DB)');
    }
    
    // Mask the URI for logging (hide credentials)
    const masked = mongoUri.replace(/:\S+@/, ':***@');
    console.log(`🔌 Connecting to your online database: ${masked}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ Connected to your online database");

    // Import models
    const requestdb = require('../Creators/requsts');
    const userdb = require('../Creators/userdb');
    const creatordb = require('../Creators/creators');

    // Check current state
    console.log("\n📊 Current Database State:");
    const totalRequests = await requestdb.countDocuments();
    const pendingRequests = await requestdb.countDocuments({ status: { $in: ["request", "pending"] } });
    const totalUsers = await userdb.countDocuments();
    const totalCreators = await creatordb.countDocuments();
    
    console.log(`- Total requests: ${totalRequests}`);
    console.log(`- Pending requests: ${pendingRequests}`);
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Total creators: ${totalCreators}`);

    // Check for users with pending balances
    const usersWithPending = await userdb.find({ 
      pending: { $gt: 0 } 
    }).select('_id balance pending').exec();
    
    console.log(`\n💰 Users with pending balances: ${usersWithPending.length}`);
    usersWithPending.forEach(user => {
      console.log(`  - User ${user._id}: balance=${user.balance}, pending=${user.pending}`);
    });

    // Check for active requests
    const activeRequests = await requestdb.find({
      status: { $in: ["request", "pending"] }
    }).exec();

    console.log(`\n📋 Active requests: ${activeRequests.length}`);
    activeRequests.forEach(req => {
      console.log(`  - Request ${req._id}: user=${req.userid}, creator=${req.creator_portfolio_id}, price=${req.price}, status=${req.status}`);
    });

    // Test the refund function with a real portfolio ID if there are active requests
    if (activeRequests.length > 0) {
      const testPortfolioId = activeRequests[0].creator_portfolio_id;
      console.log(`\n🧪 Testing refund function with portfolio: ${testPortfolioId}`);
      
      try {
        const { processPortfolioDeletionRefund } = require('./refundPendingBalances');
        const result = await processPortfolioDeletionRefund(testPortfolioId);
        console.log('Refund result:', result);
      } catch (error) {
        console.error('Refund function error:', error.message);
      }
    } else {
      console.log("\n⚠️ No active requests found to test with");
    }

    console.log("\n✅ Test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run the test
testPortfolioDeletion().catch(console.error);
