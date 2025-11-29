const userdb = require("../Creators/userdb");

/**
 * Generate a unique 6-character referral code
 * @returns {Promise<string>} A unique referral code
 */
async function generateReferralCode() {
    let code;
    let isUnique = false;

    while (!isUnique) {
        // Generate a random 6-character code (alphanumeric, uppercase)
        code = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Check if code already exists
        const existing = await userdb.findOne({ referralCode: code }).exec();
        if (!existing) {
            isUnique = true;
        }
    }

    return code;
}

/**
 * Reward a user for a successful referral
 * @param {string} referrerId - User ID of the referrer
 * @param {number} rewardAmount - Amount to reward (default: 100 coins)
 * @returns {Promise<void>}
 */
async function rewardReferrer(referrerId, rewardAmount = 1.7) {
    try {
        const referrer = await userdb.findById(referrerId);
        if (!referrer) {
            console.error(`Referrer with ID ${referrerId} not found`);
            return;
        }

        // Increment reward balance
        referrer.rewardBalance = (referrer.rewardBalance || 0) + rewardAmount;

        // Increment referral count
        referrer.referralCount = (referrer.referralCount || 0) + 1;

        await referrer.save();

        console.log(`✅ Rewarded ${rewardAmount} coins to referrer ${referrerId}`);
    } catch (error) {
        console.error(`Error rewarding referrer ${referrerId}:`, error);
    }
}

module.exports = {
    generateReferralCode,
    rewardReferrer,
    checkFuzzyDeviceMatch,
    grantSignUpBonus
};

// Levenshtein distance implementation
const getLevenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Check if a device ID is fuzzy matched with any existing device ID
 * @param {string} deviceId 
 * @returns {Promise<boolean>}
 */
async function checkFuzzyDeviceMatch(deviceId) {
    if (!deviceId) return false;

    // Fetch all users with a deviceId
    // Optimization: limit fields to deviceId only
    const users = await userdb.find({ deviceId: { $exists: true, $ne: null } }).select('deviceId').exec();

    for (const user of users) {
        if (user.deviceId === deviceId) return true; // Exact match

        const distance = getLevenshteinDistance(deviceId, user.deviceId);
        const maxLength = Math.max(deviceId.length, user.deviceId.length);
        const similarity = (maxLength - distance) / maxLength;

        if (similarity >= 0.7) {
            return true;
        }
    }

    return false;
}

/**
 * Grant sign-up bonus to a new user
 * @param {string} userId 
 * @returns {Promise<void>}
 */
async function grantSignUpBonus(userId) {
    try {
        const user = await userdb.findById(userId);
        if (!user) return;

        // Grant bonus (e.g., 0.5 reward balance)
        user.rewardBalance = (user.rewardBalance || 0) + 0.5;
        await user.save();
        console.log(`✅ Sign-up bonus awarded to user ${userId}`);
    } catch (error) {
        console.error(`Error granting sign-up bonus to ${userId}:`, error);
    }
}
