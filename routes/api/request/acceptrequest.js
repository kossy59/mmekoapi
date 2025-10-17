const express = require('express')
const router = express.Router();
const requested = require('../../../Controller/Request/acceptRequest');


router.route('/')
.post(requested)

module.exports = router;