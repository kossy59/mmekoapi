const express = require("express");
const router = express.Router();
const controller = require("../../../Controller/withdrawRequest/withdraw.controller");
const verifyJwt = require("../../../Middleware/verify");
const isAdmin = require("../../../Middleware/isAdmin");


router.post("/", verifyJwt, controller.handleWithdrawRequest); // normal user can request

// Only admin can perform the following:
router.get("/", verifyJwt, isAdmin, controller.getAllWithdrawRequests);
// 👇 NEW route for getting all withdrawal requests by user (must come before /:id)
router.get("/all/:userId", verifyJwt, controller.getAllWithdrawRequestsByUserId);
// 👇 NEW route for polling the withdraw status
router.get("/status/:userId", verifyJwt, controller.getWithdrawStatusByUserId);
// 👇 Temporary route to check admin status
router.get("/check-admin", verifyJwt, controller.checkAdminStatus);
router.get("/:id", verifyJwt, isAdmin, controller.getWithdrawRequestById);
router.patch("/:id/pay",  controller.markAsPaid);
router.delete("/:id", verifyJwt, isAdmin, controller.deleteWithdrawRequest);
// In your withdrawRequest routes




module.exports = router;
