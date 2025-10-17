const express = require('express');
const router = express.Router();
const { updateRatingsWithVipData } = require('../../scripts/updateRatingsWithVipData');

// Route to update existing ratings with VIP data
router.post('/update-ratings-vip', async (req, res) => {
  try {
    console.log('🔄 [API] Starting VIP data update for ratings...');
    
    await updateRatingsWithVipData();
    
    res.status(200).json({
      ok: true,
      message: "Ratings updated with VIP data successfully"
    });
    
  } catch (error) {
    console.error('❌ [API] Error updating ratings with VIP data:', error);
    res.status(500).json({
      ok: false,
      message: "Failed to update ratings with VIP data",
      error: error.message
    });
  }
});

module.exports = router;
