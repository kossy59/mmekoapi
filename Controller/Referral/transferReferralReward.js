const userdb = require("../../Creators/userdb");
const balancehistory = require("../../Creators/mainbalance");

/**
 * Transfer referral rewards to main earning wallet
 */
const transferReferralReward = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware

        if (!userId) {
            return res.status(401).json({
                ok: false,
                message: "Unauthorized",
            });
        }

        // Get user data
        let user = await userdb.findById(userId);

        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "User not found",
            });
        }

        const rewardBalance = user.rewardBalance || 0;

        // Check if balance is sufficient (>= 1)
        if (rewardBalance < 1) {
            return res.status(400).json({
                ok: false,
                message: "Insufficient reward balance. Minimum transfer amount is $1.",
            });
        }

        // Perform transfer
        const transferAmount = rewardBalance;

        // 1. Reset reward balance
        user.rewardBalance = 0;

        // 2. Add to earnings (ensure earnings is a number)
        user.earnings = (user.earnings || 0) + transferAmount;

        await user.save();

        // 3. Record transaction history
        const newTransaction = new balancehistory({
            userid: userId,
            details: "Referral reward transfer to earnings",
            income: transferAmount.toString(),
            spent: "0",
            date: Date.now().toString()
        });

        await newTransaction.save();

        return res.status(200).json({
            ok: true,
            message: "Successfully transferred rewards to earnings",
            data: {
                transferredAmount: transferAmount,
                newRewardBalance: 0,
                newEarnings: user.earnings
            }
        });

    } catch (error) {
        console.error("❌ Error transferring referral rewards:", error);
        return res.status(500).json({
            ok: false,
            message: "Error transferring rewards",
            error: error.message,
        });
    }
};

module.exports = transferReferralReward;
