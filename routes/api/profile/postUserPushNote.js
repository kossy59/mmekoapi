const express = require('express')
const router = express.Router();
const updatesetting = require('../../../Controller/profile/updatepushNote');
// const verifyJwt = require('../../../Middleware/verify');

router.route('/')
.post(updatesetting)
.delete(updatesetting)

module.exports = router;