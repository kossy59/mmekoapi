const userdb = require("../../Creators/userdb");

const processAutoRenewal = async () => {
  try {
    // Find all users with expired VIP status
    const now = new Date();
    const expiredVipUsers = await userdb.find({
      isVip: true,
      vipEndDate: { $lte: now },
      vipAutoRenewal: true
    }).exec();

    console.log(`Found ${expiredVipUsers.length} expired VIP users to check for auto-renewal`);

    for (const user of expiredVipUsers) {
      const requiredCoins = 10; // Same as upgrade requirement
      const userCoins = user.coinBalance || 0;

      if (userCoins >= requiredCoins) {
        // User has enough coins, renew VIP
        user.coinBalance = userCoins - requiredCoins;
        
        // Extend VIP for 2 minutes (for testing)
        const newEndDate = new Date();
        newEndDate.setMinutes(newEndDate.getMinutes() + 2);
        user.vipEndDate = newEndDate;

        await user.save();
        console.log(`Auto-renewed VIP for user ${user._id}. New end date: ${newEndDate}`);
      } else {
        // User doesn't have enough coins, disable VIP
        user.isVip = false;
        user.vipAutoRenewal = false;
        await user.save();
        console.log(`Disabled VIP for user ${user._id} due to insufficient coins`);
      }
    }

    return {
      processed: expiredVipUsers.length,
      message: "Auto-renewal process completed"
    };

  } catch (error) {
    console.error("Error in auto-renewal process:", error);
    throw error;
  }
};

// Function to add coins to a user (for testing)
const addCoins = async (userid, amount = 20) => {
  try {
    console.log("Adding coins to user:", userid, "amount:", amount);
    
    const user = await userdb.findOne({ _id: userid }).exec();
    
    if (!user) {
      console.log("User not found:", userid);
      return {
        ok: false,
        message: "User not found"
      };
    }

    console.log("User found, current balance:", user.coinBalance);
    
    user.coinBalance = (user.coinBalance || 0) + amount;
    await user.save();

    console.log("New balance after adding coins:", user.coinBalance);

    return {
      ok: true,
      message: `Added ${amount} coins to user`,
      newBalance: user.coinBalance
    };

  } catch (error) {
    console.error("Error adding coins:", error);
    return {
      ok: false,
      message: "Failed to add coins",
      error: error.message
    };
  }
};

module.exports = {
  processAutoRenewal,
  addCoins
};
