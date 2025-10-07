const express = require("express");
const router = express.Router();
const { processExpiredRequests } = require("../../scripts/processExpiredRequests");

// Process expired requests endpoint (can be called by cron job)
router.post("/", async (req, res) => {
  try {
    await processExpiredRequests();
    res.status(200).json({
      ok: true,
      message: "Expired requests processed successfully"
    });
  } catch (error) {
    console.error("Error processing expired requests:", error);
    res.status(500).json({
      ok: false,
      message: "Error processing expired requests"
    });
  }
});

module.exports = router;
