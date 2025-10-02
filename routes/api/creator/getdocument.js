const express = require("express");
const router = express.Router();
const getDocument = require("../../../Controller/Model/getdocument");

// GET all documents (or filter by userid with query)
router.get("/", getDocument);

module.exports = router;