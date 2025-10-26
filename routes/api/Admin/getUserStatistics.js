const express = require('express')
const router = express.Router();
const getUserStatistics = require('../../../Controller/Admin/getUserStatistics');

router.route('/:userId')
.get(getUserStatistics)

module.exports = router;
