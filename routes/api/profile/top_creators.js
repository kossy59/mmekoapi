const express = require('express');
const router = express.Router();
const getTopCreators = require('../../../Controller/profile/get_top_creators');

// GET endpoint for top creators - Public access (no auth required)
router.get('/', getTopCreators);

module.exports = router;
