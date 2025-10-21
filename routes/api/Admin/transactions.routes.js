const express = require("express");
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
  getTransactionStats
} = require("../../../Controller/Admin/getTransactions");
const verifyJwt = require("../../../Middleware/verify");
const isAdmin = require("../../../Middleware/isAdmin");

// Apply authentication and admin middleware to all routes
router.use(verifyJwt);
router.use(isAdmin);

// Get all transactions with filtering and pagination
router.get("/", getTransactions);

// Get transaction by ID
router.get("/:id", getTransactionById);

// Update transaction status
router.put("/:id/status", updateTransactionStatus);

// Get transaction statistics
router.get("/stats/overview", getTransactionStats);

module.exports = router;
