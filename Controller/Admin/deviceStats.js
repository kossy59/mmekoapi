/**
 * Admin endpoint to get device fingerprint statistics
 * Provides insights into fraud detection effectiveness
 */

const userdb = require("../../Creators/userdb");

const getDeviceStats = async (req, res) => {
    try {
        // Verify admin authorization
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                ok: false,
                message: "Unauthorized: Admin access required"
            });
        }

        console.log('[DeviceStats] 📊 Generating device fingerprint statistics...');

        // 1. Total users
        const totalUsers = await userdb.countDocuments();

        // 2. Users with device IDs
        const usersWithDeviceId = await userdb.countDocuments({
            deviceId: { $exists: true, $ne: null }
        });

        // 3. Analyze device ID types
        const allDeviceIds = await userdb
            .find({ deviceId: { $exists: true, $ne: null } })
            .select('deviceId username createdAt')
            .lean()
            .exec();

        let devicesWithPersistentId = 0;
        let devicesWithBrowserFpOnly = 0;

        allDeviceIds.forEach(user => {
            if (user.deviceId && user.deviceId.includes('::')) {
                devicesWithPersistentId++;
            } else {
                devicesWithBrowserFpOnly++;
            }
        });

        // 4. Find suspicious devices (multiple accounts with same device)
        const deviceGroups = {};
        allDeviceIds.forEach(user => {
            const parts = user.deviceId.split('::');
            const persistentId = parts[0]; // First part or whole ID

            if (!deviceGroups[persistentId]) {
                deviceGroups[persistentId] = [];
            }
            deviceGroups[persistentId].push(user.username);
        });

        const suspiciousDevices = Object.values(deviceGroups)
            .filter((users) => users.length > 1).length;

        // 5. Calculate average devices per user
        const averageDevicesPerUser = totalUsers > 0
            ? usersWithDeviceId / totalUsers
            : 0;

        // 6. Recent statistics (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsers = await userdb.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const recentUsersWithDevice = await userdb.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            deviceId: { $exists: true, $ne: null }
        });

        const deviceAdoptionRate = recentUsers > 0
            ? (recentUsersWithDevice / recentUsers) * 100
            : 0;

        const stats = {
            totalUsers,
            totalDevices: usersWithDeviceId,
            devicesWithPersistentId,
            devicesWithBrowserFpOnly,
            averageDevicesPerUser: parseFloat(averageDevicesPerUser.toFixed(2)),
            suspiciousDevices,
            recentStats: {
                newUsersLast30Days: recentUsers,
                withDeviceId: recentUsersWithDevice,
                adoptionRate: parseFloat(deviceAdoptionRate.toFixed(1))
            },
            coverage: {
                persistent: parseFloat(((devicesWithPersistentId / usersWithDeviceId) * 100).toFixed(1)),
                browserOnly: parseFloat(((devicesWithBrowserFpOnly / usersWithDeviceId) * 100).toFixed(1))
            }
        };

        console.log('[DeviceStats] ✅ Statistics generated:', stats);

        return res.status(200).json({
            ok: true,
            stats
        });

    } catch (error) {
        console.error('[DeviceStats] ❌ Error generating statistics:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error generating device statistics',
            error: error.message
        });
    }
};

/**
 * Get list of suspicious devices (multiple accounts)
 */
const getSuspiciousDevices = async (req, res) => {
    try {
        // Verify admin authorization
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                ok: false,
                message: "Unauthorized: Admin access required"
            });
        }

        console.log('[DeviceStats] 🔍 Searching for suspicious devices...');

        // Get all device IDs
        const allDeviceIds = await userdb
            .find({ deviceId: { $exists: true, $ne: null } })
            .select('deviceId username createdAt rewardBalance')
            .lean()
            .exec();

        // Group by persistent ID (first part before ::)
        const deviceGroups = {};
        allDeviceIds.forEach(user => {
            const parts = user.deviceId.split('::');
            const persistentId = parts[0];

            if (!deviceGroups[persistentId]) {
                deviceGroups[persistentId] = {
                    deviceId: persistentId,
                    fullDeviceIds: [],
                    users: []
                };
            }

            deviceGroups[persistentId].fullDeviceIds.push(user.deviceId);
            deviceGroups[persistentId].users.push({
                username: user.username,
                createdAt: user.createdAt,
                rewardBalance: user.rewardBalance || 0
            });
        });

        // Filter to only suspicious (multiple accounts)
        const suspicious = Object.values(deviceGroups)
            .filter((group) => group.users.length > 1)
            .map((group) => ({
                deviceId: group.deviceId,
                accountCount: group.users.length,
                users: group.users,
                totalRewards: group.users.reduce((sum, u) => sum + (u.rewardBalance || 0), 0),
                firstSeen: new Date(Math.min(...group.users.map((u) => new Date(u.createdAt).getTime()))),
                lastSeen: new Date(Math.max(...group.users.map((u) => new Date(u.createdAt).getTime())))
            }))
            .sort((a, b) => b.accountCount - a.accountCount); // Sort by most accounts

        console.log(`[DeviceStats] ⚠️ Found ${suspicious.length} suspicious devices`);

        return res.status(200).json({
            ok: true,
            count: suspicious.length,
            devices: suspicious
        });

    } catch (error) {
        console.error('[DeviceStats] ❌ Error finding suspicious devices:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error finding suspicious devices',
            error: error.message
        });
    }
};

module.exports = {
    getDeviceStats,
    getSuspiciousDevices
};
