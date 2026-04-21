const express = require('express')
const router = express.Router();
const verify = require('../../../Controller/Creator/verifycreator');
const verifyFan = require('../../../Controller/Creator/verifyfan');
const rejectFan = require('../../../Controller/Creator/rejectfan');

router.route('/verifyfan').post(verifyFan);
router.route('/rejectfan').post(rejectFan);

router.route('/')
.post(verify)

module.exports = router;