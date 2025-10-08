// Middleware/isAdmin.js// Adjust path if needed
const User = require("../Creators/userdb");
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const isAdminFromToken = req.isAdmin;

    console.log("🔍 [isAdmin Middleware] Admin check debug:");
    console.log("📋 [isAdmin Middleware] User ID from token:", userId);
    console.log("📋 [isAdmin Middleware] isAdmin from token:", isAdminFromToken);
    console.log("📋 [isAdmin Middleware] isAdmin type:", typeof isAdminFromToken);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID" });
    }

    // Use token's isAdmin field first (faster)
    if (isAdminFromToken === true || isAdminFromToken === "true" || isAdminFromToken === 1) {
      console.log("✅ [isAdmin Middleware] Admin access granted from token");
      return next();
    }

    // Fallback to database check
    const user = await User.findById(userId);
    console.log("📋 [isAdmin Middleware] Database user found:", !!user);
    console.log("📋 [isAdmin Middleware] Database user admin:", user?.admin);
    console.log("📋 [isAdmin Middleware] Database user admin type:", typeof user?.admin);

    if (!user || user.admin !== true) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    console.log("✅ [isAdmin Middleware] Admin access granted from database");
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = isAdmin;
