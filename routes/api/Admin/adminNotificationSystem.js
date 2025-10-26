const express = require('express')
const router = express.Router();
const adminNotificationSystem = require('../../../Controller/Admin/adminNotificationSystem');

router.route('/')
.post(adminNotificationSystem)

module.exports = router;
