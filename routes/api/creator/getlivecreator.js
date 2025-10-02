const express = require('express')
const router = express.Router();
const verifycreators = require('../../../Controller/Creator/getverifycreator');


router.route('/')
.post(verifycreators)

module.exports = router;
