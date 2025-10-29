const userdb = require("../../Creators/userdb");

const banUser = async (req, res) => {
    const { userId, reason } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    console.log(`🚫 [API] Ban request received:`, { userId, reason, hasToken: !!token });

    if (!userId) {
        console.log(`❌ [API] No user ID provided`);
        return res.status(400).json({ "ok": false, 'message': 'User ID is required' });
    }

    if (!token) {
        console.log(`❌ [API] No authorization token provided`);
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        // Find the user
        console.log(`🔍 [API] Looking for user with ID: ${userId}`);
        const user = await userdb.findOne({ _id: userId }).exec();
        
        if (!user) {
            console.log(`❌ [API] User not found: ${userId}`);
            return res.status(404).json({ "ok": false, 'message': 'User not found' });
        }

        console.log(`👤 [API] User found:`, {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            currentlyBanned: user.banned
        });

        // Check if user is already banned
        if (user.banned) {
            console.log(`⚠️ [API] User is already banned: ${userId}`);
            return res.status(400).json({ "ok": false, 'message': 'User is already banned' });
        }

        // Ban the user
        console.log(`🚫 [API] Banning user: ${userId} with reason: ${reason || "Violation of terms of service"}`);
        
        const updateResult = await userdb.updateOne(
            { _id: userId }, 
            { 
                $set: { 
                    banned: true, 
                    banReason: reason || "Violation of terms of service",
                    bannedAt: new Date()
                } 
            }
        );

        console.log(`📝 [API] Update result:`, {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
            acknowledged: updateResult.acknowledged
        });

        // Verify the ban was applied
        const updatedUser = await userdb.findOne({ _id: userId }).exec();
        console.log(`✅ [API] User after ban:`, {
            _id: updatedUser._id,
            banned: updatedUser.banned,
            banReason: updatedUser.banReason,
            bannedAt: updatedUser.bannedAt
        });

        res.status(200).json({
            "ok": true,
            'message': 'User banned successfully',
            'userId': userId,
            'reason': reason || "Violation of terms of service"
        });

    } catch (error) {
        console.error('❌ [API] Error banning user:', error);
        res.status(500).json({ "ok": false, 'message': 'Internal server error' });
    }
};

module.exports = banUser;
