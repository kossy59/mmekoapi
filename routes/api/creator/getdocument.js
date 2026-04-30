// routes/api/creator/getdocument.js
const express = require("express");
const router = express.Router();
const getdocument = require("../../../Controller/Creator/getdocument");
const getFanDocuments = require("../../../Controller/Creator/getFanDocuments");

router.get("/", getdocument);
router.get("/fan", getFanDocuments);  

module.exports = router;