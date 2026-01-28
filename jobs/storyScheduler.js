const cron = require('node-cron');
const {
    generateDailyStory,
    markExpiredStories,
    deleteOldStories
} = require('../Controller/AiStoryController');

// Initialize all scheduled tasks
function initializeScheduledTasks() {
    console.log('📅 Initializing scheduled tasks...');

    // Generate daily story at 12:00 AM every day
    cron.schedule('0 0 * * *', async () => {
        const now = new Date();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌅 Running daily story generation cron job...');
        console.log(`🕒 Triggered at: ${now.toISOString()}`);
        console.log(`📅 UTC Time: ${now.toUTCString()}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        try {
            await generateDailyStory();
            console.log('✅ Daily story generation completed successfully');
            console.log(`🕒 Completed at: ${new Date().toISOString()}`);
        } catch (error) {
            console.error('❌ Daily story generation failed:', error.message);
            console.error('📋 Error details:', error);
        }
    }, {
        timezone: "UTC" // Change to your timezone if needed (e.g., "America/New_York")
    });

    // Mark expired stories every hour
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running mark expired stories cron job...');
        try {
            await markExpiredStories();
            console.log('✅ Mark expired stories completed');
        } catch (error) {
            console.error('❌ Mark expired stories failed:', error);
        }
    });

    // Delete old stories at 1:00 AM every day
    cron.schedule('0 1 * * *', async () => {
        console.log('🗑️  Running delete old stories cron job...');
        try {
            await deleteOldStories();
            console.log('✅ Delete old stories completed');
        } catch (error) {
            console.error('❌ Delete old stories failed:', error);
        }
    }, {
        timezone: "UTC" // Change to your timezone if needed
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All scheduled tasks initialized:');
    console.log('   - Daily story generation: 12:00 AM UTC (daily)');
    console.log('   - Mark expired stories: Every hour');
    console.log('   - Delete old stories: 1:00 AM UTC (daily)');
    console.log(`🕒 Server time: ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

module.exports = { initializeScheduledTasks };
