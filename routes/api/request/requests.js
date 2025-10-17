const express = require('express')
const router = express.Router();
const requested = require('../../../Controller/Request/requesthost');


router.route('/')
.put(requested)

module.exports = router;