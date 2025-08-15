const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/profile/get_history_month');
// const verifyJwt = require('../../../Middleware/verify');

router.route('/')
.post(Editprofile)


module.exports = router;