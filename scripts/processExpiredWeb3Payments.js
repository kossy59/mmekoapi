const cron = require('node-cron');
const { processExpiredPayments } = require('../Controller/accountPayment/web3payment');

/**
 * Cron job to process expired Web3 payments
 * Runs every minute to check for expired payments
 */
const startExpiredPaymentsCron = () => {
  console.log('🕐 Starting expired payments cron job...');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log(`🕐 [CRON] Running expired payments check at ${new Date().toISOString()}`);
      await processExpiredPayments();
    } catch (error) {
      console.error('❌ [CRON] Error in expired payments cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Expired payments cron job started (runs every minute)');
};

module.exports = {
  startExpiredPaymentsCron
};
