const express = require('express');
const router = express.Router();
const getAllFanRequests = require('../../../Controller/Request/getAllFanRequests');

router.route('/')
  .post(getAllFanRequests);

module.exports = router;
