const userdb = require("../../Creators/userdb");

const unbanUser = async (req, res) => {
    const { userId } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!userId) {
        return res.status(400).json({ "ok": false, 'message': 'User ID is required' });
    }

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        // Find the user
        const user = await userdb.findOne({ _id: userId }).exec();
        if (!user) {
            return res.status(404).json({ "ok": false, 'message': 'User not found' });
        }

        // Check if user is not banned
        if (!user.banned) {
            return res.status(400).json({ "ok": false, 'message': 'User is not banned' });
        }

        // Unban the user
        await userdb.updateOne(
            { _id: userId }, 
            { 
                $set: { 
                    banned: false, 
                    banReason: "",
                    bannedAt: null
                } 
            }
        );

        res.status(200).json({
            "ok": true,
            'message': 'User unbanned successfully',
            'userId': userId
        });

    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({ "ok": false, 'message': 'Internal server error' });
    }
};

module.exports = unbanUser;
