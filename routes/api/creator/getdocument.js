const express = require("express");
const router = express.Router();
const getDocument = require("../../../Controller/Creator/getdocument");

// GET all documents (or filter by userid with query)
router.get("/", getDocument);

module.exports = router;