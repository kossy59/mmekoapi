const express = require('express')
const router = express.Router();
const like = require('../../../Controller/Like/Newlike');

// Add logging middleware for like routes
router.use((req, res, next) => {
  console.log("🔥 [ROUTE] Like route accessed:", {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers
  });
  next();
});

router.route('/')
.put(like)


module.exports = router;