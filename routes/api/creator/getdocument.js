const express = require("express");
const router = express.Router();
const getdocument = require("../../../Controller/Creator/getdocument");

// GET all documents (or filter by userid with query)
router.get("/", getdocument);

module.exports = router;