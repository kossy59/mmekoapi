const historydb = require("../../Creators/mainbalance");
const userdb = require("../../Creators/userdb");

const getTopCreators = async (req, res) => {
    try {
        // Get ALL transactions with income for ALL users
        // NOTE: This includes ALL users with ANY earnings (creators, fans, referral earners, etc.)
        // No filtering by transaction type - captures everyone who earned money
        const earningTransactions = await historydb.find({
            income: { $exists: true, $ne: "" },
        }).exec();

        // Group by user ID and calculate total earnings
        const creatorEarnings = {};

        earningTransactions.forEach((transaction) => {
            const userId = transaction.userid;
            const earned = parseFloat(transaction.income || "0");

            if (earned > 0) {
                if (!creatorEarnings[userId]) {
                    creatorEarnings[userId] = 0;
                }
                creatorEarnings[userId] += earned;
            }
        });

        // Convert to array and sort by total earnings
        const sortedCreators = Object.entries(creatorEarnings)
            .map(([userId, totalEarned]) => ({
                userId,
                totalEarned,
            }))
            .sort((a, b) => b.totalEarned - a.totalEarned)
            .slice(0, 15); // Get top 15

        // Fetch user details for top creators
        // NOTE: Only users with creator_verified: true will appear in this list
        const topCreatorsWithDetails = await Promise.all(
            sortedCreators.map(async (creator) => {
                try {
                    const user = await userdb.findById(creator.userId).exec();

                    if (!user) {
                        return null;
                    }

                    // Filter removed: Include all users who have earnings
                    // if (!user.creator_verified) {
                    //    return null;
                    // }

                    return {
                        userId: creator.userId,
                        username: user.username || "User",
                        photolink: user.photolink || null,
                        totalEarned: creator.totalEarned,
                        totalEarnedUSD: (creator.totalEarned * 0.04).toFixed(2), // Convert gold to USD if applicable
                    };
                } catch (error) {
                    console.error(`Error fetching user ${creator.userId}:`, error);
                    return null;
                }
            })
        );

        // Filter out null values (users not found)
        const validTopEarners = topCreatorsWithDetails.filter((creator) => creator !== null);

        return res.status(200).json({
            ok: true,
            message: "Top creators fetched successfully",
            creators: validTopEarners, // Kept as 'creators' for backwards compatibility with frontend
        });
    } catch (err) {
        console.error("Error fetching top creators:", err);
        return res.status(500).json({ ok: false, message: `${err.message}!` });
    }
};

module.exports = getTopCreators;
