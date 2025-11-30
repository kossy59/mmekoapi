const userActivity = require("../Creators/userActivity");
const userdb = require("../Creators/userdb");

/**
 * Calculate referral milestone progress for a given referral
 * This function encapsulates the 7-day challenge logic
 * @param {Object} referral - The referral document from database
 * @returns {Object} Progress data including completion status and daily breakdown
 */
async function calculateReferralProgress(referral) {
    try {
        const refereeId = referral.refereeId;
        const refereeCreatedAt = referral.createdAt;

        // Calculate 7 days from account creation
        const startDate = new Date(refereeCreatedAt);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);

        const now = new Date();

        // Get daily activity for the period
        const activities = await userActivity.find({
            userid: refereeId,
            date: {
                $gte: startDate,
                $lt: endDate
            }
        }).sort({ date: 1 });

        const requiredMinutes = 120 * 60 * 1000; // 120 minutes in ms
        const activityMap = new Map();
        activities.forEach(activity => {
            const dateKey = activity.date.toISOString().split('T')[0];
            activityMap.set(dateKey, activity);
        });

        let consecutiveDays = 0;
        let progressDetails = [];
        let allDaysMet = true;

        // Check each of the 7 days
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() + i);
            const dateKey = checkDate.toISOString().split('T')[0];

            const dayActivity = activityMap.get(dateKey);
            const timeSpent = dayActivity ? dayActivity.totalTimeSpent : 0;
            const minutesSpent = Math.floor(timeSpent / (60 * 1000));

            const isFuture = checkDate > now;
            const isToday = checkDate.toDateString() === now.toDateString();
            const completed = timeSpent >= requiredMinutes;

            if (!completed && !isFuture) {
                // If it's today, it might still be in progress
                if (!isToday) {
                    allDaysMet = false;
                }
            }

            if (completed) consecutiveDays++;

            progressDetails.push({
                day: i + 1,
                date: dateKey,
                minutes: minutesSpent,
                completed: completed,
                isToday: isToday,
                isFuture: isFuture
            });
        }

        let updated = false;

        // Check if milestone completed just now
        if (allDaysMet && consecutiveDays === 7 && !referral.milestoneCompleted) {
            // Reward logic
            const referrerId = referral.referrerId;
            const referrer = await userdb.findById(referrerId);
            if (referrer) {
                referrer.rewardBalance = (referrer.rewardBalance || 0) + 25;
                await referrer.save();
            }

            referral.milestoneCompleted = true;
            referral.milestoneCompletedAt = new Date();
            referral.milestoneReward = 25;
            await referral.save();
            updated = true;
        } else if (now > endDate && !allDaysMet && !referral.milestoneCompleted && !referral.milestoneFailed) {
            // Mark as failed if time is up
            referral.milestoneFailed = true;
            await referral.save();
            updated = true;
        }

        // Calculate current day number (1-7)
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysPassed = Math.floor((now - startDate) / msPerDay);
        const currentDayNumber = Math.min(7, Math.max(1, daysPassed + 1));

        // Calculate total minutes spent across all 7 days
        let totalMinutesSpent = 0;
        progressDetails.forEach(d => totalMinutesSpent += d.minutes);

        return {
            milestoneCompleted: referral.milestoneCompleted,
            milestoneFailed: referral.milestoneFailed,
            consecutiveDays,
            totalMinutesSpent,
            currentDayNumber,
            progressDetails,
            daysRemaining: Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))),
            todayProgress: progressDetails.find(d => d.isToday) || null,
            updated
        };
    } catch (error) {
        console.error("❌ Error calculating referral progress:", error);
        throw error;
    }
}

module.exports = { calculateReferralProgress };
