const gethistory = require("../../helpers/earning_in_month");

const Monthly_history = async (req, res) => {
  const userid = req.body.userid;

  console.log("🔍 [CONTROLLER] Inside monthly history for userid:", userid);
  console.log("📋 [CONTROLLER] Request body:", req.body);

  if (!userid) {
    console.log("❌ [CONTROLLER] Invalid user ID provided");
    return res.status(409).json({ ok: false, message: `Invalid user ID` });
  }

  try {
    console.log("🚀 [CONTROLLER] Calling gethistory helper...");
    let Month = await gethistory(userid);
    
    console.log("✅ [CONTROLLER] Helper returned data:");
    console.log("📊 [CONTROLLER] Month data type:", typeof Month);
    console.log("📊 [CONTROLLER] Month data length:", Month ? Month.length : 'undefined');
    console.log("📋 [CONTROLLER] Month data:", JSON.stringify(Month, null, 2));

    return res.status(200).json({ ok: true, message: `Monthly history fetched`, Month });
  } catch (err) {
    console.log("❌ [CONTROLLER] Error in monthly history:", err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = Monthly_history;
