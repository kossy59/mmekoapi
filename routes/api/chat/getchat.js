const express = require('express')
const router = express.Router();
const currentchat = require('../../../Controller/Message/getcurrentChat');
const verifyJwt = require('../../../Middleware/verify');
const verifyJwtBody = require('../../../Middleware/verifyBody');


router.route('/')
.put(verifyJwtBody, currentchat)

module.exports = router;