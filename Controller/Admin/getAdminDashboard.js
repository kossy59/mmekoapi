const userdb = require("../../Creators/userdb");
const postdb = require("../../Creators/post");
const exclusivedb = require("../../Creators/exclusivedb");
const creators = require("../../Creators/creators");
const mainbalance = require("../../Creators/mainbalance");
const admindb = require("../../Creators/admindb");

const getAdminDashboard = async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        // Get total user count
        const totalUsers = await userdb.countDocuments().exec();
        
        // Get active users count
        const activeUsers = await userdb.countDocuments({ active: true }).exec();
        
        // Get creator count
        const creatorCount = await userdb.countDocuments({ creator_portfolio: true }).exec();
        
        // Get verified creators count
        const verifiedCreators = await userdb.countDocuments({ creator_verified: true }).exec();
        
        // Get VIP users count
        const vipUsers = await userdb.countDocuments({ isVip: true }).exec();
        
        // Get gender breakdown
        const genderStats = await userdb.aggregate([
            {
                $group: {
                    _id: "$gender",
                    count: { $sum: 1 }
                }
            }
        ]).exec();
        
        // Get country breakdown (top 10)
        const countryStats = await userdb.aggregate([
            {
                $group: {
                    _id: "$country",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).exec();
        
        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRegistrations = await userdb.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        }).exec();
        
        // Get total posts count
        const totalPosts = await postdb.countDocuments().exec();
        
        // Get total exclusive content count
        const totalExclusiveContent = await exclusivedb.countDocuments().exec();
        
        // Get pending notifications count
        const pendingNotifications = await admindb.countDocuments({ seen: false }).exec();
        
        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentActivity = {
            newUsers: await userdb.countDocuments({ createdAt: { $gte: sevenDaysAgo } }).exec(),
            newPosts: await postdb.countDocuments({ createdAt: { $gte: sevenDaysAgo } }).exec(),
            newExclusiveContent: await exclusivedb.countDocuments({ createdAt: { $gte: sevenDaysAgo } }).exec()
        };
        
        // Get financial overview
        const financialOverview = await userdb.aggregate([
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: { $toDouble: { $ifNull: ["$balance", "0"] } } },
                    totalEarnings: { $sum: { $toDouble: { $ifNull: ["$earnings", "0"] } } },
                    totalCoinBalance: { $sum: { $toDouble: { $ifNull: ["$coinBalance", "0"] } } },
                    totalPending: { $sum: { $toDouble: { $ifNull: ["$pending", "0"] } } }
                }
            }
        ]).exec();
        
        const dashboard = {
            overview: {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                creatorCount,
                verifiedCreators,
                unverifiedCreators: creatorCount - verifiedCreators,
                vipUsers,
                regularUsers: totalUsers - vipUsers
            },
            content: {
                totalPosts,
                totalExclusiveContent,
                pendingNotifications
            },
            demographics: {
                genderBreakdown: genderStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                topCountries: countryStats
            },
            activity: {
                recentRegistrations,
                recentActivity
            },
            financial: financialOverview[0] || {
                totalBalance: 0,
                totalEarnings: 0,
                totalCoinBalance: 0,
                totalPending: 0
            }
        };

        return res.status(200).json({
            "ok": true,
            "message": "Admin dashboard data retrieved successfully",
            "data": dashboard,
            "timestamp": new Date().toISOString()
        });

    } catch (err) {
        console.error('Error getting admin dashboard:', err);
        return res.status(500).json({ "ok": false, 'message': `Failed to get admin dashboard: ${err.message}` });
    }
};

module.exports = getAdminDashboard;
