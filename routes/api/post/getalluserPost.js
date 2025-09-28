const express = require('express')
const router = express.Router();
const getalluserPost = require('../../../Controller/Post/Getalluserpost');

// POST route for fetching user posts with userid in request body
router.route('/')
.post(getalluserPost)

// GET route for fetching user posts with userid as query parameter
router.route('/')
.get((req, res) => {
  // Add userid to the body from query parameter for the controller
  req.body = { ...req.body, userid: req.query.userid };
  getalluserPost(req, res);
});

module.exports = router;