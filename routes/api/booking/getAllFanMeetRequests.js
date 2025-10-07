const express = require('express');
const router = express.Router();
const getAllFanMeetRequests = require('../../../Controller/Booking/getAllFanMeetRequests');

router.route('/')
  .post(getAllFanMeetRequests);

module.exports = router;
