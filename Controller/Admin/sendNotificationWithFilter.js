const userdb = require("../../Creators/userdb");
const admindb = require("../../Creators/admindb");
const { pushActivityNotification } = require("../../utiils/sendPushnot");

const sendNotificationWithFilter = async (req, res) => {
    const { 
        message, 
        targetGender, 
        targetUserIds 
    } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!message) {
        return res.status(400).json({ "ok": false, 'message': 'Message is required' });
    }

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        let targetUsers = [];

        // If specific user IDs are provided, use those
        if (targetUserIds && targetUserIds.length > 0) {
            const users = await userdb.find({ _id: { $in: targetUserIds } }).exec();
            targetUsers = users;
        } else {
            // Get users based on gender filter
            let query = {};
            
            if (targetGender && targetGender !== 'all') {
                query.gender = targetGender.toLowerCase();
            }
            
            targetUsers = await userdb.find(query).exec();
        }

        if (targetUsers.length === 0) {
            return res.status(404).json({ 
                "ok": false, 
                'message': 'No users found matching the criteria' 
            });
        }

        const userIds = targetUsers.map(user => user._id);
        const notificationData = [];

        // Create notifications for all target users
        for (let i = 0; i < userIds.length; i++) {
            const notification = {
                userid: userIds[i],
                message: message,
                seen: false,
                type: 'admin_notification',
                createdAt: new Date()
            };

            notificationData.push(notification);
        }

        // Insert all notifications
        await admindb.insertMany(notificationData);

        // Send push notifications
        for (let i = 0; i < userIds.length; i++) {
            try {
                await pushActivityNotification(userIds[i], message, "admin_notification");
            } catch (pushError) {
                console.log(`Failed to send push notification to user ${userIds[i]}:`, pushError);
                // Continue with other users even if one push notification fails
            }
        }

        return res.status(200).json({
            "ok": true,
            "message": `Notification sent successfully to ${userIds.length} users`,
            "targetCount": userIds.length,
            "targetGender": targetGender || 'all',
            "notificationType": 'admin_broadcast'
        });

    } catch (err) {
        console.error('Error sending notification:', err);
        return res.status(500).json({ "ok": false, 'message': `Failed to send notification: ${err.message}` });
    }
};

module.exports = sendNotificationWithFilter;
