#!/usr/bin/env node

/**
 * Detailed analysis script to investigate pending balances
 */

const mongoose = require('mongoose');

async function analyzePendingBalances() {
  try {
    console.log("🔍 Analyzing Pending Balances");
    console.log("=============================");
    
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

    // Get users with pending balances
    console.log("\n💰 Users with Pending Balances:");
    const usersWithPending = await userdb.find({ 
      pending: { $gt: 0 } 
    }).select('_id balance pending').exec();
    
    console.log(`Found ${usersWithPending.length} users with pending balances:`);
    
    for (const user of usersWithPending) {
      console.log(`\n👤 User ${user._id}:`);
      console.log(`   Balance: ${user.balance}`);
      console.log(`   Pending: ${user.pending}`);
      
      // Check all requests for this user
      const userRequests = await requestdb.find({ userid: user._id }).exec();
      console.log(`   Total requests: ${userRequests.length}`);
      
      if (userRequests.length > 0) {
        console.log(`   Request details:`);
        userRequests.forEach((req, index) => {
          console.log(`     ${index + 1}. ID: ${req._id}`);
          console.log(`        Status: ${req.status}`);
          console.log(`        Price: ${req.price}`);
          console.log(`        Creator: ${req.creator_portfolio_id}`);
          console.log(`        Type: ${req.type}`);
          console.log(`        Date: ${req.date}`);
          console.log(`        Time: ${req.time}`);
        });
        
        // Check if creator still exists
        const uniqueCreators = [...new Set(userRequests.map(req => req.creator_portfolio_id))];
        for (const creatorId of uniqueCreators) {
          const creatorExists = await creatordb.findOne({ _id: creatorId }).exec();
          console.log(`   Creator ${creatorId}: ${creatorExists ? '✅ EXISTS' : '❌ DELETED'}`);
        }
      }
    }

    // Check all request statuses
    console.log("\n📊 Request Status Analysis:");
    const statusCounts = await requestdb.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).exec();
    
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count} requests`);
    });

    // Check for requests with prices that match pending balances
    console.log("\n🔍 Matching Pending Balances with Requests:");
    for (const user of usersWithPending) {
      const userRequests = await requestdb.find({ userid: user._id }).exec();
      const totalRequestPrice = userRequests.reduce((sum, req) => sum + (parseFloat(req.price) || 0), 0);
      const pendingAmount = parseFloat(user.pending);
      
      console.log(`\n👤 User ${user._id}:`);
      console.log(`   Pending balance: ${pendingAmount}`);
      console.log(`   Total request prices: ${totalRequestPrice}`);
      console.log(`   Match: ${Math.abs(pendingAmount - totalRequestPrice) < 0.01 ? '✅ YES' : '❌ NO'}`);
    }

    console.log("\n✅ Analysis completed!");

  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run the analysis
analyzePendingBalances().catch(console.error);
