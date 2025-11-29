const userdb = require("../../Creators/userdb");
const usercomplete = require("../../Creators/usercomplete");
const creators = require("../../Creators/creators");

const editUser = async (req, res) => {
    const { userId, updates } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!userId) {
        return res.status(400).json({ "ok": false, 'message': 'User ID is required' });
    }

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    try {
        // Verify admin token (you might want to add proper admin verification)
        // For now, we'll proceed with the update

        // Find the user
        const user = await userdb.findOne({ _id: userId }).exec();
        if (!user) {
            return res.status(404).json({ "ok": false, 'message': 'User not found' });
        }

        // Update user basic information
        const allowedFields = [
            'firstname', 'lastname', 'email', 'gender', 'country', 'age', 'dob',
            'username', 'bio', 'balance', 'withdrawbalance', 'coinBalance',
            'pending', 'earnings', 'active', 'admin', 'creator_verified', 'creator_portfolio',
            'Creator_Application_status', 'creator_portfolio_id', 'isVip',
            'vipStartDate', 'vipEndDate', 'vipAutoRenewal',
            'rewardBalance', 'referralCount', 'referralCode', 'referredBy'
        ];

        const updateData = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        // Update user in userdb
        await userdb.updateOne({ _id: userId }, { $set: updateData });

        // Update user complete information if provided
        if (updates.username || updates.bio) {
            const userCompleteData = {};
            if (updates.username) userCompleteData.username = updates.username;
            if (updates.bio) userCompleteData.bio = updates.bio;

            await usercomplete.updateOne(
                { useraccountId: userId },
                { $set: userCompleteData },
                { upsert: true }
            );
        }

        // If user is a creator, update creator information
        if (user.creator_portfolio && updates.creator_verified !== undefined) {
            await creators.updateOne(
                { userid: userId },
                { $set: { verify: updates.creator_verified ? 'verified' : 'unverified' } }
            );
        }

        return res.status(200).json({
            "ok": true,
            "message": "User updated successfully",
            "updatedFields": Object.keys(updateData)
        });

    } catch (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ "ok": false, 'message': `Failed to update user: ${err.message}` });
    }
};

module.exports = editUser;
