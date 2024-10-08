const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Booking/allrequest');


router.route('/')
.post(booked)

module.exports = router;