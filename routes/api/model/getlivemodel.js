const express = require('express')
const router = express.Router();
const verifymodels = require('../../../Controller/Model/getverifymodel');


router.route('/')
.post(verifymodels)

module.exports = router;