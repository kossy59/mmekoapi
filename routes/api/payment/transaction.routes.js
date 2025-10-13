const express = require("express");
const { createPayment, handleWebhook } = require("../../../Controller/accountPayment/goldpayment");
const router = express.Router();

router.post("/create", createPayment);
router.post("/webhook", handleWebhook);

module.exports = router;
