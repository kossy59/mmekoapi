const express = require("express");
const router = express.Router();
const updateFollowers = require("../../../Controller/Creator/updateFollowers");

router.route("/update-followers").post(updateFollowers);

module.exports = router;
