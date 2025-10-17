const express = require('express')
const router = express.Router();
const requested = require('../../../Controller/Creator/deletereview');


router.route('/')
.put(requested)

module.exports = router;
