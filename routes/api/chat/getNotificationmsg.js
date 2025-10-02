const express = require('express')
const router = express.Router();
const Msgnotify = require('../../../Controller/Message/MsgNotify');
const verifyJwt = require('../../../Middleware/verify');
const verifyJwtBody = require('../../../Middleware/verifyBody');


router.route('/')
.put(verifyJwtBody, Msgnotify)

module.exports = router;