const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Request/getstats');


router.route('/')
.put(booked)

module.exports = router;