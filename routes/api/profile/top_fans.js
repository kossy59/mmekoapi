const express = require('express');
const router = express.Router();
const getTopFans = require('../../../Controller/profile/get_top_fans');

// GET endpoint for top fans
router.get('/', getTopFans);

module.exports = router;
