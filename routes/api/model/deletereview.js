const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Model/deletereview');


router.route('/')
.put(booked)

module.exports = router;
