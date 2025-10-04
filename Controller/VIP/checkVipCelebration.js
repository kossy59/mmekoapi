const UserDB = require("../../Creators/userdb");

const checkVipCelebration = async (req, res) => {
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

    // Find the VIP user
    const vipUser = await UserDB.findById(userid);
    if (!vipUser) {
      return res.status(404).json({
        ok: false,
        message: "VIP user not found"
      });
    }

    // Check if user is VIP
    if (!vipUser.isVip) {
      return res.json({
        ok: true,
        shouldShowCelebration: false,
        reason: "User is not VIP"
      });
    }

    // Check if VIP has expired
    if (vipUser.vipEndDate && new Date(vipUser.vipEndDate) < new Date()) {
      return res.json({
        ok: true,
        shouldShowCelebration: false,
        reason: "VIP has expired"
      });
    }

    // Get celebration tracking data
    const celebrationData = vipUser.vipCelebrationViewed || new Map();
    const lastViewedMonth = celebrationData.get(viewerid);

    // Check if celebration was already shown this month
    const shouldShow = lastViewedMonth !== monthKey;

    res.json({
      ok: true,
      shouldShowCelebration: shouldShow,
      monthKey: monthKey,
      lastViewedMonth: lastViewedMonth
    });

  } catch (error) {
    console.error("Error checking VIP celebration:", error);
    res.status(500).json({
      ok: false,
      message: "Internal server error"
    });
  }
};

module.exports = checkVipCelebration;
