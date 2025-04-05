const express = require('express')
const router = express.Router();
const Msgnotify = require('../../../Controller/Message/getmsgNotify');


router.route('/')
.put(Msgnotify)

module.exports = router;