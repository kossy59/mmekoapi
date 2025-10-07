const express = require('express')
const router = express.Router();
const completeBooking = require('../../../Controller/Booking/completebook');

router.route('/')
.post(completeBooking)

module.exports = router;
