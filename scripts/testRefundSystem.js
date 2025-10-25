#!/usr/bin/env node

/**
 * Test script to verify the refund system is working correctly
 */

const mongoose = require('mongoose');
const { processPortfolioDeletionRefund, getPendingBalanceStats } = require('./refundPendingBalances');

async function testRefundSystem() {
  try {
    console.log("🧪 Testing Refund System");
    console.log("========================");
    
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

    // Get current statistics
    console.log("\n📊 Current Statistics:");
    const stats = await getPendingBalanceStats();
    console.log(stats);

    // Test the refund function with a fake portfolio ID
    console.log("\n🔄 Testing refund function...");
    const testPortfolioId = "test_portfolio_123";
    const result = await processPortfolioDeletionRefund(testPortfolioId);
    console.log("Refund result:", result);

    console.log("\n✅ Test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run the test
testRefundSystem().catch(console.error);
