const express = require("express");
const router = express.Router();
const updateFollowers = require("../../../Controller/Model/updateFollowers");

router.route("/update-followers").post(updateFollowers);

module.exports = router;
