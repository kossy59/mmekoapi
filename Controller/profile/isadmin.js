const userdb = require("../../Creators/userdb");

exports.checkAdmin = async (req, res) => {
  try {
    const userID = req.header("x-user-id"); // 👈 read from request header

    if (!userID) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const user = await userdb.findById(userID);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      isAdmin: user.admin === true, // check explicitly
    });
  } catch (err) {
    console.error("Error checking admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
