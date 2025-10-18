const userdb = require("../../Creators/userdb");

exports.checkAdmin = async (req, res) => {
  try {
    const user = await userdb.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      isAdmin: !!user.admin, // converts truthy value to boolean
    });
  } catch (err) {
    console.error("Error checking admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
