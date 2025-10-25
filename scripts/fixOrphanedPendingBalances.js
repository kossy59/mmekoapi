#!/usr/bin/env node

/**
 * Script to fix orphaned pending balances where users have pending money
 * but no active requests (requests are expired, declined, completed, etc.)
 */

const mongoose = require('mongoose');

async function fixOrphanedPendingBalances() {
  try {
    console.log("🔧 Fixing Orphaned Pending Balances");
    console.log("===================================");
    
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
    const historydb = require('../Creators/mainbalance');

    // Get users with pending balances
    const usersWithPending = await userdb.find({ 
      pending: { $gt: 0 } 
    }).select('_id balance pending').exec();
    
    console.log(`\n💰 Found ${usersWithPending.length} users with pending balances`);
    
    let totalRefunded = 0;
    let usersProcessed = 0;
    
    for (const user of usersWithPending) {
      console.log(`\n👤 Processing User ${user._id}:`);
      console.log(`   Current balance: ${user.balance}`);
      console.log(`   Current pending: ${user.pending}`);
      
      // Get all requests for this user
      const userRequests = await requestdb.find({ userid: user._id }).exec();
      
      if (userRequests.length === 0) {
        console.log(`   ❌ No requests found - this is an orphaned pending balance!`);
        
        // Refund the entire pending balance
        const refundAmount = parseFloat(user.pending);
        const currentBalance = parseFloat(user.balance);
        
        user.balance = String(currentBalance + refundAmount);
        user.pending = "0";
        await user.save();
        
        // Create refund history
        const refundHistory = {
          userid: user._id,
          details: "Orphaned pending balance refund - no requests found",
          spent: "0",
          income: `${refundAmount}`,
          date: `${Date.now().toString()}`
        };
        await historydb.create(refundHistory);
        
        totalRefunded += refundAmount;
        usersProcessed++;
        
        console.log(`   ✅ Refunded ${refundAmount} to balance`);
        console.log(`   New balance: ${user.balance}`);
        console.log(`   New pending: ${user.pending}`);
      } else {
        console.log(`   📊 Found ${userRequests.length} requests`);
        
        // Check if all requests are in final states (not "request" or "pending")
        const activeRequests = userRequests.filter(req => 
          req.status === "request" || req.status === "pending"
        );
        
        if (activeRequests.length === 0) {
          console.log(`   ❌ No active requests found - all requests are in final states!`);
          
          // Calculate total price of all requests
          const totalRequestPrice = userRequests.reduce((sum, req) => 
            sum + (parseFloat(req.price) || 0), 0
          );
          
          const pendingAmount = parseFloat(user.pending);
          const difference = Math.abs(pendingAmount - totalRequestPrice);
          
          console.log(`   📊 Total request prices: ${totalRequestPrice}`);
          console.log(`   📊 Pending amount: ${pendingAmount}`);
          console.log(`   📊 Difference: ${difference}`);
          
          // If there's a significant difference, refund the pending amount
          if (difference > 0.01) {
            console.log(`   ❌ Significant difference found - refunding pending balance!`);
            
            const refundAmount = pendingAmount;
            const currentBalance = parseFloat(user.balance);
            
            user.balance = String(currentBalance + refundAmount);
            user.pending = "0";
            await user.save();
            
            // Create refund history
            const refundHistory = {
              userid: user._id,
              details: "Orphaned pending balance refund - requests in final states",
              spent: "0",
              income: `${refundAmount}`,
              date: `${Date.now().toString()}`
            };
            await historydb.create(refundHistory);
            
            totalRefunded += refundAmount;
            usersProcessed++;
            
            console.log(`   ✅ Refunded ${refundAmount} to balance`);
            console.log(`   New balance: ${user.balance}`);
            console.log(`   New pending: ${user.pending}`);
          } else {
            console.log(`   ✅ Pending balance matches request prices - no action needed`);
          }
        } else {
          console.log(`   ✅ Found ${activeRequests.length} active requests - no action needed`);
        }
      }
    }

    console.log(`\n🎉 Fix completed!`);
    console.log(`- Users processed: ${usersProcessed}`);
    console.log(`- Total refunded: ${totalRefunded}`);
    console.log(`- Users with remaining pending: ${usersWithPending.length - usersProcessed}`);

  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run the fix
fixOrphanedPendingBalances().catch(console.error);
