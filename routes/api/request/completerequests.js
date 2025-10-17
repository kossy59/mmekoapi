const express = require('express')
const router = express.Router();
const completeRequest = require('../../../Controller/Request/completeRequest');

router.route('/')
.post(completeRequest)

module.exports = router;
