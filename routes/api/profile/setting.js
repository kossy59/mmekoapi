const express = require('express')
const router = express.Router();
const updatesetting = require('../../../Controller/profile/updateSetting');

router.route('/')
.post(updatesetting)

module.exports = router;