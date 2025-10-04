const { processAutoRenewal } = require("./autoRenewal");

const triggerAutoRenewal = async (req, res) => {
  try {
    const result = await processAutoRenewal();
    
    return res.status(200).json({
      ok: true,
      message: "Auto-renewal process completed",
      result
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Auto-renewal process failed",
      error: error.message
    });
  }
};

module.exports = triggerAutoRenewal;
