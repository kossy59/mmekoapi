// const express = require("express");
// const router = express.Router();
// const controller = require("../../../Controller/withdrawRequest/withdraw.controller");
// const verifyJwt = require("../../../Middleware/verify");

// router.post("/", verifyJwt, controller.handleWithdrawRequest);
// router.get("/", controller.getAllWithdrawRequests);
// router.get("/:id", controller.getWithdrawRequestById);
// router.patch("/:id/pay", controller.markAsPaid);
// router.delete("/:id", controller.deleteWithdrawRequest);

// module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../../../Controller/withdrawRequest/withdraw.controller");
const verifyJwt = require("../../../Middleware/verify");
const isAdmin = require("../../../Middleware/isAdmin"); 

router.post("/", verifyJwt, controller.handleWithdrawRequest); // normal user can request

// Only admin can perform the following:
router.get("/", verifyJwt, isAdmin, controller.getAllWithdrawRequests);
router.get("/:id", verifyJwt, isAdmin, controller.getWithdrawRequestById);
router.patch("/:id/pay", verifyJwt, isAdmin, controller.markAsPaid);
router.delete("/:id", verifyJwt, isAdmin, controller.deleteWithdrawRequest);

module.exports = router;
