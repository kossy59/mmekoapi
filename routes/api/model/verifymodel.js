const express = require('express')
const router = express.Router();
const verify = require('../../../Controller/Model/verifymodel');


router.route('/')
.post(verify)

module.exports = router;