const express = require('express')
const router = express.Router();
const currentchat = require('../../../Controller/Message/getcurrentChat');
const verifyJwt = require('../../../Middleware/verify');


router.route('/')
.put(verifyJwt, currentchat)

module.exports = router;