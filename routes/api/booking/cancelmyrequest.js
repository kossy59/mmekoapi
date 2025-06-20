const express = require("express");
const router = express.Router();
const cancelRequest = require("../../../Controller/Booking/cancelbooking");

router.route("/").put(cancelRequest);

module.exports = router;
