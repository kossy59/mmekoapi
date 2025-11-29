const userdb = require("../../Creators/userdb");
const referraldb = require("../../Creators/referraldb");
const { generateReferralCode } = require("../../helpers/referralHelpers");

const { calculateReferralProgress } = require("../../utiils/referralProgressHelper");

/**
 * Get referral information for a user
 * Returns the user's referral code, count, and list of referrals
 */
const getReferralInfo = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        if (!userId) {
            return res.status(401).json({
                ok: false,
                message: "Unauthorized",
            });
        }

        // Get user data
        let user = await userdb.findById(userId).select('referralCode referralCount username rewardBalance');

        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "User not found",
            });
        }

        // 🎁 Generate referral code if user doesn't have one (for existing users)
        if (!user.referralCode) {
            console.log(`🔧 Generating referral code for existing user: ${userId}`);
            const newReferralCode = await generateReferralCode();
            user.referralCode = newReferralCode;
            await user.save();
            console.log(`✅ Generated referral code ${newReferralCode} for user ${userId}`);
        }

        // Get referral details
        const referrals = await referraldb
            .find({ referrerId: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        // Get referee details and calculate progress
        const referralDetails = await Promise.all(
            referrals.map(async (ref) => {
                const referee = await userdb.findById(ref.refereeId).select('username createdAt');

                // Calculate progress automatically
                const progress = await calculateReferralProgress(ref);

                return {
                    id: ref._id,
                    username: referee?.username || 'Unknown',
                    joinedAt: referee?.createdAt || ref.createdAt,
                    status: ref.status,
                    rewardAmount: ref.rewardAmount,
                    rewardType: ref.rewardType,
                    milestoneCompleted: ref.milestoneCompleted,
                    milestoneFailed: ref.milestoneFailed,
                    milestoneReward: ref.milestoneReward,
                    progress: progress // Include the detailed progress data
                };
            })
        );

        return res.status(200).json({
            ok: true,
            data: {
                referralCode: user.referralCode,
                referralCount: user.referralCount || 0,
                rewardBalance: user.rewardBalance || 0,
                referrals: referralDetails,
            },
        });
    } catch (error) {
        console.error("❌ Error fetching referral info:", error);
        return res.status(500).json({
            ok: false,
            message: "Error fetching referral information",
            error: error.message,
        });
    }
};

module.exports = getReferralInfo;
