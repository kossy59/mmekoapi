const express = require("express");
const { createPayment, handleWebhook, updateGoldBalance, verifyPayment } = require("../../../Controller/accountPayment/goldpayment");
const router = express.Router();

router.post("/create", createPayment);
router.post("/webhook", handleWebhook);
router.patch("/update-balance", updateGoldBalance);
router.get("/verify", verifyPayment);

module.exports = router;
