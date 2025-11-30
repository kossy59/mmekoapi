const referraldb = require("../Creators/referraldb");
const { calculateReferralProgress } = require("./referralProgressHelper");

/**
 * Cron job to check all pending referral milestones
 * Runs periodically to update milestone statuses
 */
async function checkReferralMilestones() {
    try {
        console.log("🔄 Running referral milestone checker...");

        // Find all referrals that are still in progress (not completed and not failed)
        const pendingReferrals = await referraldb.find({
            milestoneCompleted: false,
            milestoneFailed: false
        });

        console.log(`📊 Found ${pendingReferrals.length} pending referrals to check`);

        let completedCount = 0;
        let failedCount = 0;

        for (const referral of pendingReferrals) {
            try {
                // Use the helper to calculate progress and update status
                const progress = await calculateReferralProgress(referral);

                if (progress.updated) {
                    if (progress.milestoneCompleted) {
                        completedCount++;
                        console.log(`✅ Milestone completed for referral ${referral._id}`);
                    } else if (progress.milestoneFailed) {
                        failedCount++;
                        console.log(`❌ Milestone failed for referral ${referral._id}`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error checking referral ${referral._id}:`, error);
            }
        }

        console.log(`✅ Milestone check complete: ${completedCount} completed, ${failedCount} failed`);
    } catch (error) {
        console.error("❌ Error in referral milestone checker:", error);
    }
}

module.exports = { checkReferralMilestones };
