const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Booking/getstats');


router.route('/')
.put(booked)

module.exports = router;