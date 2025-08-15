const express = require('express')
const router = express.Router();
const Msgnotify = require('../../../Controller/Message/updateNotificaion');
const verifyJwt = require('../../../Middleware/verify');


router.route('/')
.put(verifyJwt, Msgnotify)

module.exports = router;