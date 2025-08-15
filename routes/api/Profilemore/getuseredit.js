const express = require('express')
const router = express.Router();
const getprofile = require('../../../Controller/Profilemore/getedit');
const verifyJwt = require('../../../Middleware/verify');

router.route('/')
.post(verifyJwt, getprofile)


module.exports = router;