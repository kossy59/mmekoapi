const express = require('express');
const router = express.Router();
const verifyFan = require('../../../Controller/Creator/verifyfan');
router.route('/').post(verifyFan);
module.exports = router;