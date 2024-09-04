const express = require('express')
const router = express.Router();
const currentchat = require('../../../Controller/Message/getcurrentChat');


router.route('/')
.put(currentchat)

module.exports = router;