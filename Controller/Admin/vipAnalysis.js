const userdb = require("../../Creators/userdb");
const mainbalance = require("../../Creators/mainbalance");

const getVipAnalysis = async (req, res) => {
  try {
    const { months = 5 } = req.query; // Allow filtering by number of months
    const now = new Date();
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

    // Get VIP users data for the specified months
    const vipUsers = await userdb.find({
      isVip: true,
      vipStartDate: { $gte: monthsAgo }
    }).exec();

    // Get all users for comparison
    const allUsers = await userdb.find({
      createdAt: { $gte: monthsAgo }
    }).exec();

    // VIP earnings calculation: 100 gold per VIP user per month, 1 gold = $0.04
    // So each VIP subscription = 100 * 0.04 = $4.00 per month
    const vipGoldCost = 100;
    const goldToUsdRate = 0.1099;
    const vipEarningsPerUser = vipGoldCost * goldToUsdRate; // $4.00 per VIP user per month

    // Generate monthly data for the specified months
    const monthlyData = [];
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Count VIP users active in this month
      const vipUsersInMonth = vipUsers.filter(user => {
        const vipStart = new Date(user.vipStartDate);
        const vipEnd = new Date(user.vipEndDate);
        return vipStart <= monthEnd && vipEnd >= monthStart;
      });

      // Count users with auto-renewal enabled
      const autoRenewalUsers = vipUsersInMonth.filter(user => user.vipAutoRenewal === true);

      // Calculate VIP earnings for this month: number of VIP users * $4.00
      const monthEarnings = vipUsersInMonth.length * vipEarningsPerUser;

      // Count total users registered in this month
      const newUsersInMonth = allUsers.filter(user => {
        const userCreated = new Date(user.createdAt);
        return userCreated >= monthStart && userCreated <= monthEnd;
      });

       monthlyData.push({
         month: monthName,
         monthKey,
         vipUsers: vipUsersInMonth.length,
         autoRenewalUsers: autoRenewalUsers.length,
         nonRenewalUsers: vipUsersInMonth.length - autoRenewalUsers.length,
         totalEarnings: monthEarnings,
         newUsers: newUsersInMonth.length
       });
    }

    // Calculate overall statistics
    const totalVipUsers = vipUsers.length;
    const totalAutoRenewalUsers = vipUsers.filter(user => user.vipAutoRenewal === true).length;
    const totalNonRenewalUsers = totalVipUsers - totalAutoRenewalUsers;
    const totalEarnings = monthlyData.reduce((total, month) => total + month.totalEarnings, 0);

    // Get current active VIP users
    const activeVipUsers = vipUsers.filter(user => {
      const vipEnd = new Date(user.vipEndDate);
      return vipEnd > now;
    });

    // Get VIP users expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringVipUsers = vipUsers.filter(user => {
      const vipEnd = new Date(user.vipEndDate);
      return vipEnd > now && vipEnd <= sevenDaysFromNow;
    });

    const analysis = {
      monthlyData,
      summary: {
        totalVipUsers,
        activeVipUsers: activeVipUsers.length,
        totalAutoRenewalUsers,
        totalNonRenewalUsers,
        totalEarnings,
        expiringVipUsers: expiringVipUsers.length,
        autoRenewalRate: totalVipUsers > 0 ? 
          ((totalAutoRenewalUsers / totalVipUsers) * 100).toFixed(2) : 0
      },
      trends: {
        vipGrowth: monthlyData.length > 1 ? 
          ((monthlyData[monthlyData.length - 1].vipUsers - monthlyData[0].vipUsers) / 
           Math.max(monthlyData[0].vipUsers, 1) * 100).toFixed(2) : 0,
        earningsGrowth: monthlyData.length > 1 ? 
          ((monthlyData[monthlyData.length - 1].totalEarnings - monthlyData[0].totalEarnings) / 
           Math.max(monthlyData[0].totalEarnings, 1) * 100).toFixed(2) : 0
      }
    };

    return res.status(200).json({
      ok: true,
      message: "VIP analysis data retrieved successfully",
      data: analysis
    });

  } catch (error) {
    console.error("Error getting VIP analysis:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to get VIP analysis data",
      error: error.message
    });
  }
};

module.exports = getVipAnalysis;
