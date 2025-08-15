const express = require('express')
const router = express.Router();
const updatesetting = require('../../../Controller/profile/updateSetting');
// const verifyJwt = require('../../../Middleware/verify');

router.route('/')
.post(updatesetting)

module.exports = router;