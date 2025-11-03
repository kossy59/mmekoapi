const express = require("express");
const router = express.Router();
const deleteAdminNotification = require("../../../Controller/Admin/deleteAdminNotification");

router.route("/")
    .post(deleteAdminNotification);

module.exports = router;

