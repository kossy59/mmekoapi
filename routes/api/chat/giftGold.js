const express = require('express')
const router = express.Router();
const currentchat = require('../../../Controller/Message/sendGold');


router.route('/')
.put(currentchat)

module.exports = router;