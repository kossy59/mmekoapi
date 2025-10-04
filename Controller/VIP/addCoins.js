const { addCoins } = require("./autoRenewal");

const addCoinsToUser = async (req, res) => {
  const { userid, amount = 20 } = req.body;

  console.log("Add coins request:", { userid, amount });

  if (!userid) {
    return res.status(400).json({
      ok: false,
      message: "User ID is required"
    });
  }

  try {
    const result = await addCoins(userid, amount);
    console.log("Add coins result:", result);
    
    if (result.ok) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error("Add coins error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to add coins",
      error: error.message
    });
  }
};

module.exports = addCoinsToUser;
