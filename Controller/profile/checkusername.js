const userdb = require("../../Creators/userdb");

const checkUsername = async (req, res) => {
    const { username, currentUserId } = req.body;

    if (!username) {
        return res.status(400).json({
            "ok": false,
            "message": "Username is required"
        });
    }

    try {
        // Check if username already exists (excluding current user)
        // Username comes with @ prefix from frontend
        const existingUser = await userdb.findOne({
            username: username, // username already includes @ prefix
            _id: { $ne: currentUserId } // Exclude current user from check
        });

        if (existingUser) {
            return res.status(200).json({
                "ok": true,
                "available": false,
                "message": "Username is already taken"
            });
        } else {
            return res.status(200).json({
                "ok": true,
                "available": true,
                "message": "Username is available"
            });
        }
    } catch (err) {
        console.error("Error checking username:", err);
        return res.status(500).json({
            "ok": false,
            "message": "Error checking username availability"
        });
    }
};

module.exports = checkUsername;
