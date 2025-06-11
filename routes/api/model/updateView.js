const express = require("express");
const router = express.Router();
const updateView = require("../../../Controller/Model/updateView");

router.route("/updateview").post(updateView);

module.exports = router;
