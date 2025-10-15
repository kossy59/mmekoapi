const express = require("express");
const router = express.Router();
const cancelRequest = require("../../../Controller/Request/cancelFanRequests");

router.route("/").put(cancelRequest);

module.exports = router;
