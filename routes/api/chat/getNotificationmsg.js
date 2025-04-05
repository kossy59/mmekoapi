const express = require('express')
const router = express.Router();
const Msgnotify = require('../../../Controller/Message/MsgNotify');


router.route('/')
.put(Msgnotify)

module.exports = router;