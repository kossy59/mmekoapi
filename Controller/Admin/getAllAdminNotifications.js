const admindb = require("../../Creators/admindb");
const userdb = require("../../Creators/userdb");

const getAllAdminNotifications = async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        // Get all admin notifications
        const notifications = await admindb
            .find({ adminNotification: true })
            .sort({ createdAt: -1 })
            .exec();

        // Group notifications by campaign
        // Group by: same title, message, targetGender, created within 5 minutes
        const campaigns = {};
        const processedIds = new Set();
        
        for (const notif of notifications) {
            if (processedIds.has(notif._id.toString())) continue;
            
            // Find all notifications that belong to the same campaign
            // (same title, message, targetGender, created within 5 minutes)
            const notifTime = new Date(notif.createdAt);
            const timeWindowStart = new Date(notifTime.getTime() - 5 * 60 * 1000); // 5 minutes before
            const timeWindowEnd = new Date(notifTime.getTime() + 5 * 60 * 1000); // 5 minutes after
            
            const campaignNotifications = notifications.filter(n => {
                if (processedIds.has(n._id.toString())) return false;
                return (
                    n.title === notif.title &&
                    n.message === notif.message &&
                    (n.targetGender || 'all') === (notif.targetGender || 'all') &&
                    new Date(n.createdAt) >= timeWindowStart &&
                    new Date(n.createdAt) <= timeWindowEnd
                );
            });
            
            // Mark all as processed
            campaignNotifications.forEach(n => processedIds.add(n._id.toString()));
            
            // Create campaign object
            const campaignKey = `${notif._id}_${Date.now()}`;
            const targetUserIds = [...new Set(campaignNotifications.map(n => n.userid).filter(Boolean))];
            
            campaigns[campaignKey] = {
                _id: notif._id, // Use first notification ID as campaign ID
                title: notif.title,
                message: notif.message,
                targetGender: notif.targetGender || 'all',
                isSpecificUsers: notif.targetGender === 'specific',
                hasLearnMore: notif.hasLearnMore || false,
                learnMoreUrl: notif.learnMoreUrl || null,
                isActive: campaignNotifications.some(n => n.isActive),
                type: notif.type || 'admin_broadcast',
                createdAt: notif.createdAt,
                updatedAt: campaignNotifications.reduce((latest, n) => {
                    return new Date(n.updatedAt) > new Date(latest) ? n.updatedAt : latest;
                }, notif.updatedAt),
                totalSent: campaignNotifications.length,
                targetUserIds: targetUserIds,
                users: []
            };
        }

        // Get user details for each campaign
        const campaignList = Object.values(campaigns);
        for (const campaign of campaignList) {
            if (campaign.targetUserIds.length > 0) {
                const users = await userdb.find({ _id: { $in: campaign.targetUserIds } })
                    .select('firstname lastname username photolink gender creator_verified')
                    .exec();
                campaign.users = users.map(u => ({
                    _id: u._id,
                    name: `${u.firstname} ${u.lastname}`,
                    username: u.username,
                    photolink: u.photolink,
                    gender: u.gender,
                    creator_verified: u.creator_verified
                }));
            }
        }

        return res.status(200).json({
            "ok": true,
            "campaigns": campaignList,
            "total": campaignList.length
        });

    } catch (err) {
        console.error('Error getting admin notifications:', err);
        return res.status(500).json({ "ok": false, 'message': `Failed to get notifications: ${err.message}` });
    }
};

module.exports = getAllAdminNotifications;

