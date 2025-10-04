const express = require("express");
const router = express.Router();
const checkVipCelebration = require("../../../Controller/VIP/checkVipCelebration");
const markVipCelebrationViewed = require("../../../Controller/VIP/markVipCelebrationViewed");

// Check if VIP celebration should be shown
router.post("/check", checkVipCelebration);

// Mark VIP celebration as viewed
router.post("/mark-viewed", markVipCelebrationViewed);

module.exports = router;
