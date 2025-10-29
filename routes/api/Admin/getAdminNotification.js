const express = require("express");
const router = express.Router();
const getAdminNotification = require("../../../Controller/Admin/getAdminNotification");

router
  .route("/")
  .post(getAdminNotification);

module.exports = router;
