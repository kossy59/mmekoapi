const express = require('express');
const router = express.Router();
const checkBanStatus = require('../../../Controller/Admin/checkBanStatus');

router.get('/', checkBanStatus);

module.exports = router;
