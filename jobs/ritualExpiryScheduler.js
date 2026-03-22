

const cron = require('node-cron');
const CreatorRitual = require('../models/CreatorRitual');

/**
 * Marks creator rituals as expired when their 24h window has passed.
 * Runs every hour.
 * 
 * Effect:
 *  - isExpired: false  →  appears on /anya feed (live for 24h)
 *  - isExpired: true   →  disappears from feed, appears ONLY on
 *                         the creator's profile archived tab
 */
async function markExpiredRituals() {
    try {
        const result = await CreatorRitual.updateMany(
            {
                expiresAt:  { $lt: new Date() },
                isExpired:  false
            },
            {
                $set: { isExpired: true }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`⏰ [RitualExpiry] Marked ${result.modifiedCount} ritual(s) as expired`);
        }
    } catch (err) {
        console.error('[RitualExpiry] Error marking expired rituals:', err.message);
    }
}

function scheduleRitualExpiry() {
    // Run immediately on startup to catch any missed expirations
    markExpiredRituals();

    // Then run every hour at :00
    cron.schedule('0 * * * *', () => {
        console.log('⏰ [RitualExpiry] Running hourly expiry check...');
        markExpiredRituals();
    });

    console.log('✅ [RitualExpiry] Scheduler started — runs every hour');
}

module.exports = { scheduleRitualExpiry, markExpiredRituals };