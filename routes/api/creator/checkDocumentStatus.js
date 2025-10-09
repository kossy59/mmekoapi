const express = require('express');
const router = express.Router();
const checkDocumentStatus = require('../../../Controller/Creator/checkDocumentStatus');

router.get("/:userid", checkDocumentStatus);

module.exports = router;