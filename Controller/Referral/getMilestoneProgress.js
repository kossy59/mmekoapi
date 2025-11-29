const userActivity = require("../../Creators/userActivity");
const referraldb = require("../../Creators/referraldb");

/**
 * Get referral milestone progress for a referred user
 * Shows how many days they've completed the 120-minute challenge
 */
const getReferralMilestoneProgress = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        if (!userId) {
            return res.status(401).json({
                ok: false,
                message: "Unauthorized",
            });
        }

        // Check if this user was referred
        const referral = await referraldb.findOne({
            refereeId: userId,
            status: { $in: ['completed', 'paid'] }
        });

        if (!referral) {
            return res.status(200).json({
                ok: true,
                data: {
                    isReferred: false,
                    message: "You were not referred by anyone"
                }
            });
        }

        // Check if milestone already completed or failed
        if (referral.milestoneCompleted) {
            return res.status(200).json({
                ok: true,
                data: {
                    isReferred: true,
                    milestoneStatus: 'completed',
                    completedAt: referral.milestoneCompletedAt,
                    rewardAmount: 25,
                    message: "Your referrer has already received the milestone bonus!"
                }
            });
        }

        if (referral.milestoneFailed) {
            return res.status(200).json({
                ok: true,
                data: {
                    isReferred: true,
                    milestoneStatus: 'failed',
                    message: "The 7-day challenge period has ended"
                }
            });
        }

        // Calculate progress
        const refereeCreatedAt = referral.createdAt;
        const startDate = new Date(refereeCreatedAt);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        const now = new Date();
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        // Get daily activity for the period
        const activities = await userActivity.find({
            userid: userId,
            date: {
                $gte: startDate,
                $lt: now
            }
        }).sort({ date: 1 });

        const requiredMinutes = 120 * 60 * 1000;
        const dailyProgress = [];

        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() + i);
            checkDate.setHours(0, 0, 0, 0);

            const dateKey = checkDate.toISOString().split('T')[0];
            const dayActivity = activities.find(a =>
                a.date.toISOString().split('T')[0] === dateKey
            );

            const minutesSpent = dayActivity ? Math.floor(dayActivity.totalTimeSpent / (60 * 1000)) : 0;
            const completed = minutesSpent >= 120;

            dailyProgress.push({
                day: i + 1,
                date: checkDate,
                minutesSpent,
                requiredMinutes: 120,
                completed,
                percentComplete: Math.min(100, Math.round((minutesSpent / 120) * 100))
            });
        }

        const completedDays = dailyProgress.filter(d => d.completed).length;

        return res.status(200).json({
            ok: true,
            data: {
                isReferred: true,
                milestoneStatus: 'in_progress',
                progress: {
                    completedDays,
                    totalDays: 7,
                    daysRemaining: Math.max(0, daysRemaining),
                    dailyProgress,
                },
                reward: {
                    amount: 25,
                    type: 'gold',
                    description: 'Bonus reward for your referrer when you complete the challenge'
                }
            }
        });

    } catch (error) {
        console.error("❌ Error fetching referral milestone progress:", error);
        return res.status(500).json({
            ok: false,
            message: "Error fetching milestone progress",
            error: error.message,
        });
    }
};

module.exports = getReferralMilestoneProgress;
