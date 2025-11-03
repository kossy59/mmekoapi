const admindb = require("../../Creators/admindb");

const deleteAdminNotification = async (req, res) => {
    const { campaignId } = req.body; // ID of one notification from the campaign
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    if (!campaignId) {
        return res.status(400).json({ "ok": false, 'message': 'Campaign ID is required' });
    }

    try {
        // Find the campaign notification to get its details
        const sampleNotification = await admindb.findById(campaignId).exec();
        
        if (!sampleNotification || !sampleNotification.adminNotification) {
            return res.status(404).json({ "ok": false, 'message': 'Campaign not found' });
        }

        // Group notifications by campaign - find all notifications with same title, message, targetGender, created at similar time
        const originalTitle = sampleNotification.title;
        const originalMessage = sampleNotification.message?.substring(0, 50);
        const targetGender = sampleNotification.targetGender || 'all';

        // Find all notifications from this campaign
        const startTime = new Date(sampleNotification.createdAt);
        startTime.setMinutes(startTime.getMinutes() - 1);
        const endTime = new Date(sampleNotification.createdAt);
        endTime.setMinutes(endTime.getMinutes() + 1);

        const campaignNotifications = await admindb.find({
            adminNotification: true,
            title: originalTitle,
            message: { $regex: originalMessage },
            targetGender: targetGender,
            createdAt: { $gte: startTime, $lte: endTime }
        }).exec();

        if (campaignNotifications.length === 0) {
            return res.status(404).json({ "ok": false, 'message': 'No notifications found in this campaign' });
        }

        // Delete all notifications in the campaign
        const deleteResult = await admindb.deleteMany({
            _id: { $in: campaignNotifications.map(n => n._id) }
        });

        return res.status(200).json({
            "ok": true,
            "message": `Notification campaign deleted successfully`,
            "details": {
                deletedCount: deleteResult.deletedCount
            }
        });

    } catch (err) {
        console.error('Error deleting admin notification:', err);
        return res.status(500).json({ "ok": false, 'message': `Failed to delete notification: ${err.message}` });
    }
};

module.exports = deleteAdminNotification;

