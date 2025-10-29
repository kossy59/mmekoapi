const userdb = require("../Creators/userdb");

const checkBan = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return next(); // If no userId, let other middleware handle it
        }

        // Check if user is banned
        const user = await userdb.findOne({ _id: userId }).exec();
        
        if (user && user.banned) {
            return res.status(403).json({
                ok: false,
                message: "This account has been banned for violating our rules",
                banned: true,
                banReason: user.banReason || "Violation of terms of service",
                bannedAt: user.bannedAt
            });
        }

        next();
    } catch (error) {
        console.error('Error checking ban status:', error);
        next(); // Continue if there's an error checking ban status
    }
};

module.exports = checkBan;
