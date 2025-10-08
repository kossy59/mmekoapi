const express = require("express");
const router = express.Router();
const getTransactionHistory = require("../../../Controller/profile/get_transaction_history.js");

router.post("/", getTransactionHistory);

module.exports = router;
