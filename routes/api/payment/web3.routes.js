const express = require("express");
const router = express.Router();
const {
  createWeb3Payment,
  checkWeb3PaymentStatus,
  getWalletBalance,
  verifyTransactionHash,
  cancelWeb3Payment,
  manualProcessExpired
} = require("../../../Controller/accountPayment/web3payment");

// Web3 Payment Routes
router.post("/create", createWeb3Payment);
router.get("/status/:orderId", checkWeb3PaymentStatus);
router.get("/balance/:walletAddress", getWalletBalance);
router.post("/verify-tx", verifyTransactionHash);
router.post("/cancel/:orderId", cancelWeb3Payment);
router.post("/process-expired", manualProcessExpired);

module.exports = router;
