const userdb = require("../../Creators/userdb");

const continueVip = async (req, res) => {
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

    // Check if user is VIP and VIP is still active
    if (!user.isVip || !user.vipEndDate || user.vipEndDate <= new Date()) {
      return res.status(400).json({
        ok: false,
        message: "User is not a VIP or VIP has expired"
      });
    }

    // Re-enable auto-renewal
    user.vipAutoRenewal = true;
    await user.save();

    return res.status(200).json({
      ok: true,
      message: "VIP auto-renewal enabled successfully",
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
    console.error("Error continuing VIP:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to continue VIP",
      error: error.message
    });
  }
};

module.exports = continueVip;
