const express = require("express");
const router = express.Router();
const getAllAdminNotifications = require("../../../Controller/Admin/getAllAdminNotifications");

router.route("/")
    .post(getAllAdminNotifications);

module.exports = router;

