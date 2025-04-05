const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Booking/acceptbook');


router.route('/')
.post(booked)

module.exports = router;