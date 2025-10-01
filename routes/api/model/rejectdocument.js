const express = require("express");
const router = express.Router();
const rejectDocument = require("../../../Controller/Model/rejectdocument");

// Reject a model document
router.post("/reject", rejectDocument);

module.exports = router;
