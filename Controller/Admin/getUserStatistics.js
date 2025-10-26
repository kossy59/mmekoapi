const userdb = require("../../Creators/userdb");
const postdb = require("../../Creators/post");
const exclusivedb = require("../../Creators/exclusivedb");
const creators = require("../../Creators/creators");
const mainbalance = require("../../Creators/mainbalance");

const getUserStatistics = async (req, res) => {
    const { userId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!userId) {
        return res.status(400).json({ "ok": false, 'message': 'User ID is required' });
    }

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        // Get user basic info
        const user = await userdb.findOne({ _id: userId }).exec();
        if (!user) {
            return res.status(404).json({ "ok": false, 'message': 'User not found' });
        }

        // Get user posts count
        const postsCount = await postdb.countDocuments({ userid: userId }).exec();

        // Get exclusive content count (if creator)
        let exclusiveCount = 0;
        if (user.creator_portfolio) {
            exclusiveCount = await exclusivedb.countDocuments({ userid: userId }).exec();
        }

        // Get creator info (if creator)
        let creatorInfo = null;
        if (user.creator_portfolio) {
            creatorInfo = await creators.findOne({ userid: userId }).exec();
        }

        // Get balance history (recent transactions)
        const recentTransactions = await mainbalance
            .find({ userid: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .exec();

        // Calculate total earnings from balance history
        const totalEarnings = recentTransactions.reduce((sum, transaction) => {
            return sum + (parseFloat(transaction.income) || 0);
        }, 0);

        const totalSpent = recentTransactions.reduce((sum, transaction) => {
            return sum + (parseFloat(transaction.spent) || 0);
        }, 0);

        // Get user activity stats
        const stats = {
            user: {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                gender: user.gender,
                country: user.country,
                active: user.active,
                creator_verified: user.creator_verified,
                creator_portfolio: user.creator_portfolio,
                isVip: user.isVip,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            financial: {
                balance: user.balance || "0",
                withdrawbalance: user.withdrawbalance || "0",
                coinBalance: user.coinBalance || 0,
                pending: user.pending || 0,
                earnings: user.earnings || 0,
                totalEarnings: totalEarnings,
                totalSpent: totalSpent,
                netEarnings: totalEarnings - totalSpent
            },
            content: {
                postsCount: postsCount,
                exclusiveContentCount: exclusiveCount,
                creatorInfo: creatorInfo
            },
            social: {
                followers: user.followers?.length || 0,
                following: user.following?.length || 0
            },
            recentTransactions: recentTransactions.map(transaction => ({
                type: transaction.details,
                amount: transaction.income || transaction.spent,
                date: transaction.createdAt,
                isIncome: !!transaction.income
            }))
        };

        return res.status(200).json({
            "ok": true,
            "message": "User statistics retrieved successfully",
            "data": stats
        });

    } catch (err) {
        console.error('Error getting user statistics:', err);
        return res.status(500).json({ "ok": false, 'message': `Failed to get user statistics: ${err.message}` });
    }
};

module.exports = getUserStatistics;
