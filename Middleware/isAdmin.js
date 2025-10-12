// Middleware/isAdmin.js// Adjust path if needed
const User = require("../Creators/userdb");
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const isAdminFromToken = req.isAdmin;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID" });
    }

    // Use token's isAdmin field first (faster)
    if (isAdminFromToken === true || isAdminFromToken === "true" || isAdminFromToken === 1) {
      return next();
    }

    // Fallback to database check
    const user = await User.findById(userId);

    if (!user || user.admin !== true) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = isAdmin;
