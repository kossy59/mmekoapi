#!/usr/bin/env node

/**
 * Cleanup script for portfolios that were already deleted
 * This script finds all pending requests where the creator portfolio no longer exists
 * and refunds the users their pending balances
 */

const mongoose = require('mongoose');
const { refundPendingBalances, getPendingBalanceStats } = require('./refundPendingBalances');

async function main() {
  try {
    console.log("🧹 Cleanup Script for Deleted Portfolios");
    console.log("=====================================");
    
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
    console.log("\n📊 Getting current statistics...");
    const stats = await getPendingBalanceStats();
    
    if (stats) {
      console.log("Current Statistics:");
      console.log(`- Total pending requests: ${stats.totalPendingRequests}`);
      console.log(`- Orphaned requests: ${stats.orphanedRequests}`);
      console.log(`- Orphaned amount: $${stats.orphanedAmount}`);
      console.log(`- Orphaned portfolios: ${stats.orphanedPortfolios.length}`);
      
      if (stats.orphanedPortfolios.length > 0) {
        console.log("Orphaned portfolio IDs:", stats.orphanedPortfolios);
      }
      
      if (stats.orphanedRequests === 0) {
        console.log("\n✅ No orphaned requests found. All pending balances are valid.");
        return;
      }
    }

    // Run cleanup
    console.log("\n🔄 Starting cleanup process...");
    const result = await refundPendingBalances();
    
    if (result.success) {
      console.log("\n✅ Cleanup Results:");
      console.log(`- Requests processed: ${result.processed}`);
      console.log(`- Users refunded: ${result.refunded}`);
      console.log(`- Total refund amount: $${result.totalAmount}`);
      console.log(`- Requests cancelled: ${result.cancelledRequests}`);
    } else {
      console.error("❌ Cleanup failed:", result.error);
      process.exit(1);
    }

    // Show final stats
    console.log("\n📊 Final statistics:");
    const finalStats = await getPendingBalanceStats();
    if (finalStats) {
      console.log(`- Remaining pending requests: ${finalStats.totalPendingRequests}`);
      console.log(`- Remaining orphaned requests: ${finalStats.orphanedRequests}`);
      console.log(`- Remaining orphaned amount: $${finalStats.orphanedAmount}`);
    }

    console.log("\n🎉 Cleanup completed successfully!");

  } catch (error) {
    console.error("❌ Error running cleanup:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Received SIGINT, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Received SIGTERM, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the cleanup
main().catch(console.error);
