const UserDB = require("../../Creators/userdb");

const markVipCelebrationViewed = async (req, res) => {
  try {
    const { userid, viewerid } = req.body;

    if (!userid || !viewerid) {
      return res.status(400).json({
        ok: false,
        message: "User ID and Viewer ID are required"
      });
    }

    // Get current month key
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthKey = `${currentYear}-${currentMonth}`;

    // Find and update the VIP user
    const vipUser = await UserDB.findById(userid);
    if (!vipUser) {
      return res.status(404).json({
        ok: false,
        message: "VIP user not found"
      });
    }

    // Initialize celebration data if it doesn't exist
    if (!vipUser.vipCelebrationViewed) {
      vipUser.vipCelebrationViewed = new Map();
    }

    // Mark celebration as viewed for this viewer this month
    vipUser.vipCelebrationViewed.set(viewerid, monthKey);

    // Save the updated user
    await vipUser.save();

    res.json({
      ok: true,
      message: "VIP celebration marked as viewed",
      monthKey: monthKey
    });

  } catch (error) {
    console.error("Error marking VIP celebration as viewed:", error);
    res.status(500).json({
      ok: false,
      message: "Internal server error"
    });
  }
};

module.exports = markVipCelebrationViewed;
