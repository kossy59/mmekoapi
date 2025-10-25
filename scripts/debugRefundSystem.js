#!/usr/bin/env node

/**
 * Debug script to check the refund system and database state
 */

const mongoose = require('mongoose');

async function debugRefundSystem() {
  try {
    console.log("🔍 Debugging Refund System");
    console.log("==========================");
    
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

    // Check if there are any pending requests
    console.log("\n📊 Checking Database State:");
    
    const totalRequests = await requestdb.countDocuments();
    const pendingRequests = await requestdb.countDocuments({ status: { $in: ["request", "pending"] } });
    const totalUsers = await userdb.countDocuments();
    const totalCreators = await creatordb.countDocuments();
    
    console.log(`- Total requests: ${totalRequests}`);
    console.log(`- Pending requests: ${pendingRequests}`);
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Total creators: ${totalCreators}`);

    // Check for orphaned requests
    if (pendingRequests > 0) {
      console.log("\n🔍 Checking for orphaned requests...");
      
      const allPendingRequests = await requestdb.find({ 
        status: { $in: ["request", "pending"] } 
      }).exec();

      let orphanedCount = 0;
      for (const request of allPendingRequests) {
        const creatorExists = await creatordb.findOne({
          _id: request.creator_portfolio_id
        }).exec();

        if (!creatorExists) {
          orphanedCount++;
          console.log(`❌ Orphaned request found: ${request._id} for portfolio ${request.creator_portfolio_id}`);
        }
      }
      
      console.log(`- Orphaned requests: ${orphanedCount}`);
    }

    // Check user balances
    console.log("\n💰 Checking User Balances:");
    const usersWithPending = await userdb.find({ 
      pending: { $gt: 0 } 
    }).select('_id balance pending').exec();
    
    console.log(`- Users with pending balance: ${usersWithPending.length}`);
    usersWithPending.forEach(user => {
      console.log(`  - User ${user._id}: balance=${user.balance}, pending=${user.pending}`);
    });

    console.log("\n✅ Debug completed!");

  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run the debug
debugRefundSystem().catch(console.error);
