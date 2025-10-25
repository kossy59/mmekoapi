#!/usr/bin/env node

/**
 * CLI script to manually run the orphaned pending balances cleanup
 * Usage: node runCleanup.js [--stats] [--dry-run]
 */

const { cleanupOrphanedPendingBalances, getPendingBalanceStats } = require('./cleanupOrphanedPendingBalances');
const mongoose = require('mongoose');

// Parse command line arguments
const args = process.argv.slice(2);
const showStats = args.includes('--stats');
const dryRun = args.includes('--dry-run');

async function main() {
  try {
    console.log("Orphaned Pending Balances Cleanup Tool");
    console.log("=====================================");
    
    if (dryRun) {
      console.log("DRY RUN MODE - No changes will be made");
    }

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

    // Show stats if requested
    if (showStats) {
      console.log("\nGetting current statistics...");
      const stats = await getPendingBalanceStats();
      console.log("Current Statistics:");
      console.log(`- Total pending requests: ${stats.totalPendingRequests}`);
      console.log(`- Orphaned requests: ${stats.orphanedRequests}`);
      console.log(`- Orphaned amount: $${stats.orphanedAmount}`);
      console.log(`- Orphaned portfolios: ${stats.orphanedPortfolios.length}`);
      
      if (stats.orphanedPortfolios.length > 0) {
        console.log("Orphaned portfolio IDs:", stats.orphanedPortfolios);
      }
      
      if (dryRun) {
        console.log("\nDry run completed - no changes made");
        return;
      }
    }

    // Run cleanup
    console.log("\nStarting cleanup process...");
    const result = await cleanupOrphanedPendingBalances();
    
    if (result.success) {
      console.log("\nCleanup Results:");
      console.log(`- Requests processed: ${result.processed}`);
      console.log(`- Users refunded: ${result.refunded}`);
      console.log(`- Total refund amount: $${result.totalAmount}`);
      console.log(`- Requests cancelled: ${result.cancelledRequests}`);
    } else {
      console.error("Cleanup failed:", result.error);
      process.exit(1);
    }

    // Show final stats
    if (showStats) {
      console.log("\nFinal statistics:");
      const finalStats = await getPendingBalanceStats();
      console.log(`- Remaining pending requests: ${finalStats.totalPendingRequests}`);
      console.log(`- Remaining orphaned requests: ${finalStats.orphanedRequests}`);
      console.log(`- Remaining orphaned amount: $${finalStats.orphanedAmount}`);
    }

  } catch (error) {
    console.error("Error running cleanup:", error);
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

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the main function
main().catch(console.error);
