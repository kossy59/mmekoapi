const express = require('express')
const router = express.Router();
const Msgnotify = require('../../../Controller/Message/updateNotificaion');


router.route('/')
.put(Msgnotify)

module.exports = router;