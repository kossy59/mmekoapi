const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/profile/topup');
// const verifyJwt = require('../../../Middleware/verify');

router.route('/')
.post(Editprofile)


module.exports = router;