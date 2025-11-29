const { calculateReferralProgress } = require("../../utiils/referralProgressHelper");
const referraldb = require("../../Creators/referraldb");

/**
 * Check milestone progress for a specific referral
 * Triggered manually by the referrer to see progress/update status
 */
const checkReferralProgress = async (req, res) => {
    try {
        const { referralId } = req.body;
        const referrerId = req.userId;

        if (!referralId) {
            return res.status(400).json({ ok: false, message: "Referral ID is required" });
        }

        const referral = await referraldb.findOne({
            _id: referralId,
            referrerId: referrerId
        });

        if (!referral) {
            return res.status(404).json({ ok: false, message: "Referral not found" });
        }

        const progress = await calculateReferralProgress(referral);

        if (!progress) {
            return res.status(500).json({ ok: false, message: "Error calculating progress" });
        }

        return res.status(200).json({
            ok: true,
            data: progress
        });

    } catch (error) {
        console.error("❌ Error checking referral progress:", error);
        return res.status(500).json({ ok: false, message: "Error checking progress" });
    }
};

module.exports = checkReferralProgress;
