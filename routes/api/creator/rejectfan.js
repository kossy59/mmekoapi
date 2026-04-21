const express = require('express');
const router = express.Router();
const rejectFan = require('../../../Controller/Creator/rejectfan');
router.route('/').post(rejectFan);
module.exports = router;