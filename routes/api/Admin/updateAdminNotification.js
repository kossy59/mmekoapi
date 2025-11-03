const express = require("express");
const router = express.Router();
const updateAdminNotification = require("../../../Controller/Admin/updateAdminNotification");

router.route("/")
    .post(updateAdminNotification);

module.exports = router;

