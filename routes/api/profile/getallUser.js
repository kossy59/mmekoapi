const express = require('express')
const router = express.Router();
const updatesetting = require('../../../Controller/profile/getallUser');

router.route('/')
.post(updatesetting)

module.exports = router;