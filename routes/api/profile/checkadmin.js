const express = require("express");
const router = express.Router();
const handleRefresh = require("../../../Middleware/refresh"); // must decode token
const { checkAdmin } = require("../../../Controller/profile/isadmin");

router.get("/check", handleRefresh, checkAdmin); // ✅ add auth middleware

module.exports = router;
