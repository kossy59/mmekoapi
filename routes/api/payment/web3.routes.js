const express = require("express");
const router = express.Router();
const {
  createWeb3Payment,
  checkWeb3PaymentStatus,
  getWalletBalance,
  startListening,
  stopListening,
  verifyPayment,
  cancelWeb3Payment
} = require("../../../Controller/accountPayment/web3payment");

// Web3 Payment Routes
router.post("/create", createWeb3Payment);
router.get("/status/:orderId", checkWeb3PaymentStatus);
router.get("/balance/:walletAddress", getWalletBalance);
router.post("/start-listening", startListening);
router.post("/stop-listening", stopListening);
router.post("/verify-payment", verifyPayment);
router.post("/cancel/:orderId", cancelWeb3Payment);

module.exports = router;
