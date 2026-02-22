const historydb = require("../../Creators/mainbalance");
const userdb = require("../../Creators/userdb");

const getTopFans = async (req, res) => {
    try {
        // Get all transactions related to fan spending
        // Ranked by: Fan call, Fan meet, Fan date, VIP upgrade purchase, Exclusive content purchase
        const spendingTransactions = await historydb.find({
          details: {
                $regex: /(Fan call|Fan meet|Fan date|VIP upgrade purchase|purchased exclusive content|purchase content|exclusive content|unlocked PPV message|PPV message unlocked)/i,
            },
            spent: { $exists: true, $ne: "" },
        }).exec();

        // Group by user ID and calculate total spending
        const userSpending = {};

        spendingTransactions.forEach((transaction) => {
            const userId = transaction.userid;
            const spent = parseFloat(transaction.spent || "0");

            if (spent > 0) {
                if (!userSpending[userId]) {
                    userSpending[userId] = 0;
                }
                userSpending[userId] += spent;
            }
        });

        // Convert to array and sort by total spending
        const sortedFans = Object.entries(userSpending)
            .map(([userId, totalSpent]) => ({
                userId,
                totalSpent,
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 14); // Get top 14

        // Fetch user details for top fans
        const topFansWithDetails = await Promise.all(
            sortedFans.map(async (fan) => {
                try {
                    // Validate fan.userId before querying
                    if (!fan.userId || fan.userId.length < 10) {
                        return null;
                    }

                    const user = await userdb.findById(fan.userId).exec();

                    if (!user) {
                        return null;
                    }

                    return {
                        userId: fan.userId,
                        username: user.username || "User",
                        photolink: user.photolink || null,
                        totalSpent: fan.totalSpent,
                        totalSpentUSD: (fan.totalSpent * 0.04).toFixed(2), // Convert gold to USD
                    };
                } catch (error) {
                    // Log error but don't fail the entire request
                    console.error(`Error fetching user details for ${fan.userId}:`, error.message);
                    return null;
                }
            })
        );

        // Filter out null values (users that couldn't be found)
        const validTopFans = topFansWithDetails.filter((fan) => fan !== null);

        return res.status(200).json({
            ok: true,
            message: "Top fans fetched successfully",
            fans: validTopFans,
        });
    } catch (err) {
        console.error("Error fetching top fans:", err);
        return res.status(500).json({ ok: false, message: `${err.message}!` });
    }
};

module.exports = getTopFans;
