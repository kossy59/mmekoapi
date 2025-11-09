const express = require("express");
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
  getTransactionStats,
  getRevenueByGoldPack
} = require("../../../Controller/Admin/getTransactions");
const verifyJwt = require("../../../Middleware/verify");
const isAdmin = require("../../../Middleware/isAdmin");

// Apply authentication and admin middleware to all routes
router.use(verifyJwt);
router.use(isAdmin);

// Get all transactions with filtering and pagination
router.get("/", getTransactions);

// Get transaction statistics (must come before /:id)
router.get("/stats/overview", getTransactionStats);

// Get revenue by gold pack (must come before /:id)
router.get("/revenue", getRevenueByGoldPack);

// Get transaction by ID (must come last to avoid matching other routes)
router.get("/:id", getTransactionById);

// Update transaction status
router.put("/:id/status", updateTransactionStatus);

module.exports = router;
