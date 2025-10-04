const userdb = require("../../Creators/userdb");

const resetVipForTesting = async (req, res) => {
  const { userid } = req.body;

  if (!userid) {
    return res.status(400).json({
      ok: false,
      message: "User ID is required"
    });
  }

  try {
    const user = await userdb.findOne({ _id: userid }).exec();
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found"
      });
    }

    // Reset VIP status and set to 2 minutes for testing
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + 2); // 2 minutes for testing

    user.isVip = true;
    user.vipStartDate = startDate;
    user.vipEndDate = endDate;
    user.vipAutoRenewal = true;

    await user.save();

    console.log(`Reset VIP for testing - User: ${userid}, End date: ${endDate}`);

    return res.status(200).json({
      ok: true,
      message: "VIP reset for testing (2 minutes duration)",
      vipStatus: {
        isVip: user.isVip,
        vipStartDate: user.vipStartDate,
        vipEndDate: user.vipEndDate,
        daysRemaining: Math.ceil((user.vipEndDate - new Date()) / (1000 * 60 * 60 * 24)),
        autoRenewal: user.vipAutoRenewal,
        coinBalance: user.coinBalance
      }
    });

  } catch (error) {
    console.error("Error resetting VIP for testing:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to reset VIP for testing",
      error: error.message
    });
  }
};

module.exports = resetVipForTesting;
