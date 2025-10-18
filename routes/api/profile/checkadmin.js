const express = require("express");
const router = express.Router();
const isAdmin = require("../../../Middleware/isAdmin"); 

router.get("/check", isAdmin);

module.exports = router;