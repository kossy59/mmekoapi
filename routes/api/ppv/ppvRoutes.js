const express = require("express");
const router = express.Router();
const ppvController = require("../../../Controller/PPV/PPVController");

// Request PPV feature
router.post("/request", ppvController.requestPPV);

// Admin Routes
router.get("/admin/requests", ppvController.getPPVRequests);
router.post("/admin/action", ppvController.actionPPVRequest);

// User Settings
router.put("/settings", ppvController.updatePPVSettings);

// Unlock Message
router.post("/unlock-message", ppvController.unlockMessage);

module.exports = router;
