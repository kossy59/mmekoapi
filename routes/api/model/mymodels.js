const express = require('express');
const router = express.Router();
const getMyModels = require('../../../Controller/Model/getmymodels');

router.route('/')
  .post(getMyModels);

module.exports = router;
