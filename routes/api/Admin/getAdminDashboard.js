const express = require('express')
const router = express.Router();
const getAdminDashboard = require('../../../Controller/Admin/getAdminDashboard');

router.route('/')
.get(getAdminDashboard)

module.exports = router;
