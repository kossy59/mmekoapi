const express = require('express')
const router = express.Router();
const deletepro = require('../../../Controller/profile/deleteAccount');

router.route('/')
.post(deletepro)


module.exports = router;