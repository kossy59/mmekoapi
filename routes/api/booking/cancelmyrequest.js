const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Booking/cancelrequest');


router.route('/')
.put(booked)

module.exports = router;