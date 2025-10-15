const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Request/pendingrequests');


router.route('/')
.put(booked)

module.exports = router;