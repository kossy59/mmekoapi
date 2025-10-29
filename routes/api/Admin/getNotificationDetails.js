const express = require("express");
const router = express.Router();
const getNotificationDetails = require("../../../Controller/Admin/getNotificationDetails");

router
  .route("/")
  .post(getNotificationDetails);

module.exports = router;
