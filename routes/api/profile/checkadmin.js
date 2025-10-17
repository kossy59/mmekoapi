const express = require("express");
const router = express.Router();
const isAdmin = require("../../../Middleware/isAdmin"); 

// Example: simple admin check endpoint
router.get("/check", isAdmin, (req, res) => {
  res.json({ success: true, isAdmin: true });
});

module.exports = router;
