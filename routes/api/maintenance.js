const express = require("express");
const router = express.Router();
const verifyJwt = require("../../Middleware/verify");
const maintenanceController = require("../../Controller/Admin/maintenanceController");

const verifyAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};

// Public route to get status
router.get("/", maintenanceController.getMaintenanceStatus);

// Public route to get sort status (needs to be public so client can check default sort)
router.get("/sort-status", maintenanceController.getCreatorSortStatus);

// Admin route to toggle status
router.post("/toggle", verifyJwt, verifyAdmin, maintenanceController.toggleMaintenanceStatus);

// Admin route to toggle sort status
router.post("/toggle-sort", verifyJwt, verifyAdmin, maintenanceController.toggleCreatorSortStatus);

module.exports = router;
