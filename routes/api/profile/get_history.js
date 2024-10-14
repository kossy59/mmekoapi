const express = require('express')
const router = express.Router();
const Editprofile = require('../../../Controller/profile/get_history');

router.route('/')
.post(Editprofile)


module.exports = router;