const express = require('express');
const router = express.Router();
const checkPortfolio = require('../../../Controller/Creator/checkportfolio');

router.route('/:userid')
    .get(checkPortfolio)
    .post(checkPortfolio);

module.exports = router;
