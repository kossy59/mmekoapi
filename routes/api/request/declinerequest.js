const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Request/declinerequests');


router.route('/')
.put(booked)

module.exports = router;