const express = require("express");
const router = express.Router();
const verifyJwt = require("../../../Middleware/verify");
const { createCryptoPayment, checkPaymentStatus } = require("../../../Controller/accountPayment/payment.conroller");

// Create a new payment invoice (NOWPayments)
router.post("/payment/create", createCryptoPayment);

// Check payment status by paymentId
router.get("/status/:paymentId", checkPaymentStatus);

module.exports = router;