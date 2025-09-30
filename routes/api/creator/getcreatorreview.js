const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Creator/getcreatorreview');


router.route('/')
.put(booked)

module.exports = router;
