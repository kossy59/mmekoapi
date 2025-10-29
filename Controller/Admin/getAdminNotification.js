const userdb = require("../../Creators/userdb");
const admindb = require("../../Creators/admindb");

const getAdminNotification = async (req, res) => {
    const { userid } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!userid) {
        return res.status(400).json({ "ok": false, 'message': 'User ID is required' });
    }

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        // Get user info to check gender and creator status
        const user = await userdb.findById(userid).exec();
        if (!user) {
            return res.status(404).json({ "ok": false, 'message': 'User not found' });
        }

        // Get the most recent active admin notification for this specific user
        // The system creates individual notifications for each user, so we look for this user's notification
        const notification = await admindb.findOne({
            adminNotification: true,
            isActive: true,
            userid: userid // Look for notification specifically created for this user
        }).sort({ createdAt: -1 }).exec();

        if (!notification) {
            return res.status(200).json({ 
                "ok": true, 
                "success": false,
                "message": "No active admin notifications found" 
            });
        }

        // Check if this notification was already dismissed by this user
        const dismissedId = notification._id.toString();
        // Note: We'll check localStorage on the frontend for dismissal status
        // This is because we want to keep the notification in the database for other users

        return res.status(200).json({
            "ok": true,
            "success": true,
            "notification": {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                hasLearnMore: notification.hasLearnMore || false,
                learnMoreUrl: notification.learnMoreUrl || null,
                targetGender: notification.targetGender,
                createdAt: notification.createdAt
            }
        });

    } catch (err) {
        console.error('Error fetching admin notification:', err);
        return res.status(500).json({ "ok": false, 'message': `Failed to fetch notification: ${err.message}` });
    }
};

module.exports = getAdminNotification;
