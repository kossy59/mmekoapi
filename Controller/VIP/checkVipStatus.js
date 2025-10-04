const userdb = require("../../Creators/userdb");

const checkVipStatus = async (req, res) => {
  const { userid } = req.body;
  
  console.log(`🔍 [VIP STATUS CHECK] Starting VIP status check for user: ${userid}`);
  
  if (!userid) {
    console.log(`❌ [VIP STATUS CHECK] User ID is required`);
    return res.status(400).json({ ok: false, message: "User ID is required" });
  }

  try {
    console.log(`🔍 [VIP STATUS CHECK] Looking up user in database: ${userid}`);
    const user = await userdb.findOne({ _id: userid }).exec();
    
    if (!user) {
      console.log(`❌ [VIP STATUS CHECK] User not found: ${userid}`);
      return res.status(404).json({ ok: false, message: "User not found" });
    }
    
    console.log(`✅ [VIP STATUS CHECK] User found: ${user.firstname} ${user.lastname} (${userid})`);
    
    // Check VIP status
    const isVip = user.isVip || false;
    const vipStartDate = user.vipStartDate;
    const vipEndDate = user.vipEndDate;
    
    // Calculate days remaining
    let daysRemaining = 0;
    if (isVip && vipEndDate) {
      const now = new Date();
      const endDate = new Date(vipEndDate);
      const diffTime = endDate - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, daysRemaining); // Don't show negative days
    }
    
    const vipStatus = {
      isVip,
      vipStartDate,
      vipEndDate,
      daysRemaining
    };
    
    console.log(`🦁 [VIP STATUS CHECK] VIP Status for ${user.firstname} ${user.lastname}:`, {
      isVip,
      vipStartDate,
      vipEndDate,
      daysRemaining,
      isActive: isVip && vipEndDate && new Date(vipEndDate) > new Date()
    });
    
    console.log(`✅ [VIP STATUS CHECK] Successfully retrieved VIP status for user: ${userid}`);
    
    return res.status(200).json({
      ok: true,
      message: "VIP status retrieved successfully",
      vipStatus
    });
    
  } catch (error) {
    console.error(`❌ [VIP STATUS CHECK] Error checking VIP status:`, error);
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = { checkVipStatus };
