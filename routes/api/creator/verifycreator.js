const express = require('express')
const router = express.Router();
const verify = require('../../../Controller/Creator/verifycreator');


router.route('/')
.post(verify)

module.exports = router;