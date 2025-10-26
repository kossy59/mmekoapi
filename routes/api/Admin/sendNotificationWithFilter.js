const express = require('express')
const router = express.Router();
const sendNotificationWithFilter = require('../../../Controller/Admin/sendNotificationWithFilter');

router.route('/')
.post(sendNotificationWithFilter)

module.exports = router;
