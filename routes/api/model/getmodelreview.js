const express = require('express')
const router = express.Router();
const booked = require('../../../Controller/Model/getmodelreview');


router.route('/')
.put(booked)

module.exports = router;
