const express = require('express');
const router = express.Router();
const getAllExclusivePosts = require('../../../Controller/Post/getAllExclusivePosts');

// POST route for fetching exclusive posts with userid in request body
router.route('/')
  .post(getAllExclusivePosts)
  // GET route for fetching exclusive posts with userid as query parameter
  .get((req, res) => {
    // Add userid to the body from query parameter for the controller
    req.body = { ...req.body, userid: req.query.userid };
    getAllExclusivePosts(req, res);
  });

module.exports = router;

