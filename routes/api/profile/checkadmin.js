const express = require("express");
const router = express.Router();
const { checkAdmin } = require("../../../Controller/profile/isadmin");

router.get("/check", checkAdmin);

module.exports = router;