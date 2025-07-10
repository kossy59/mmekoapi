const express = require("express");
const router = express.Router();
const controller = require("../../../Controller/withdrawRequest/withdraw.controller");
const verifyJwt = require("../../../Middleware/verify");
const isAdmin = require("../../../Middleware/isAdmin"); 

router.post("/", verifyJwt, controller.handleWithdrawRequest); // normal user can request

// Only admin can perform the following:
router.get("/", verifyJwt, isAdmin, controller.getAllWithdrawRequests);
router.get("/:id", verifyJwt, isAdmin, controller.getWithdrawRequestById);
router.patch("/:id/pay",  controller.markAsPaid);
router.delete("/:id", verifyJwt, isAdmin, controller.deleteWithdrawRequest);

module.exports = router;
