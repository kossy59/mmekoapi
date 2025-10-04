const userdb = require("../../Creators/userdb");

const getUserBalance = async (req, res) => {
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

    return res.status(200).json({
      ok: true,
      coinBalance: user.coinBalance || 0,
      isVip: user.isVip || false,
      vipAutoRenewal: user.vipAutoRenewal || false
    });

  } catch (error) {
    console.error("Error getting user balance:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to get user balance",
      error: error.message
    });
  }
};

module.exports = getUserBalance;
