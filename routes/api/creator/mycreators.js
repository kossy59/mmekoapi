const express = require('express');
const router = express.Router();
const getMyCreators = require('../../../Controller/Creator/getmycreators');

router.route('/')
  .post(getMyCreators);

module.exports = router;
