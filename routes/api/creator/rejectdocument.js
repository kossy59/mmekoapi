const express = require("express");
const router = express.Router();
const rejectdocument = require("../../../Controller/Creator/rejectdocument");

// Reject a model document
router.post("/", rejectdocument);

module.exports = router;
