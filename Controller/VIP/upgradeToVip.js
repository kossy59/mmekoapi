const userdb = require("../../Creators/userdb");

const upgradeToVip = async (req, res) => {
  const { userid, duration = 2 } = req.body; // duration in minutes for testing, default 2 minutes

  if (!userid) {
    return res.status(400).json({
      ok: false,
      message: "User ID is required"
    });
  }

  try {
    // Find the user
    const user = await userdb.findOne({ _id: userid }).exec();
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found"
      });
    }

    // Check if user has enough coins (hardcoded requirement: 10 coins)
    const requiredCoins = 10;
    const userCoins = user.coinBalance || 0;
    
    if (userCoins < requiredCoins) {
      return res.status(400).json({
        ok: false,
        message: `Insufficient coins. You need ${requiredCoins} coins to upgrade to VIP. You have ${userCoins} coins.`
      });
    }

    // Deduct coins from user's balance
    user.coinBalance = userCoins - requiredCoins;

    // Calculate VIP dates (using minutes for testing)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + duration);

    // Update user with VIP status
    user.isVip = true;
    user.vipStartDate = startDate;
    user.vipEndDate = endDate;
    user.vipAutoRenewal = true; // Enable auto-renewal by default

    await user.save();

    return res.status(200).json({
      ok: true,
      message: "Successfully upgraded to VIP",
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
    return res.status(500).json({
      ok: false,
      message: "Failed to upgrade to VIP",
      error: error.message
    });
  }
};

const checkVipStatus = async (req, res) => {
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

    // Check if VIP is still active
    const now = new Date();
    const isVipActive = user.isVip && user.vipEndDate && user.vipEndDate > now;

    // If VIP has expired, update the status
    if (user.isVip && user.vipEndDate && user.vipEndDate <= now) {
      user.isVip = false;
      await user.save();
    }

    const daysRemaining = isVipActive ? Math.ceil((user.vipEndDate - now) / (1000 * 60 * 60 * 24)) : 0;
    
    const vipStatus = {
      isVip: isVipActive,
      vipStartDate: user.vipStartDate,
      vipEndDate: user.vipEndDate,
      daysRemaining,
      autoRenewal: user.vipAutoRenewal || false,
      coinBalance: user.coinBalance || 0
    };

    return res.status(200).json({
      ok: true,
      vipStatus
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to check VIP status",
      error: error.message
    });
  }
};

const cancelVip = async (req, res) => {
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

    // Disable auto-renewal instead of removing VIP status
    user.vipAutoRenewal = false;

    await user.save();

    return res.status(200).json({
      ok: true,
      message: "VIP auto-renewal cancelled successfully. Your VIP will remain active until it expires.",
      vipStatus: {
        isVip: user.isVip,
        vipStartDate: user.vipStartDate,
        vipEndDate: user.vipEndDate,
        autoRenewal: user.vipAutoRenewal,
        daysRemaining: Math.ceil((user.vipEndDate - new Date()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to cancel VIP subscription",
      error: error.message
    });
  }
};

module.exports = {
  upgradeToVip,
  checkVipStatus,
  cancelVip
};
