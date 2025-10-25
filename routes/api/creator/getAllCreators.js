const express = require('express');
const router = express.Router();
const getAllCreators = require('../../../Controller/Creator/getAllCreators');

router.route('/')
  .get(getAllCreators);

module.exports = router;
