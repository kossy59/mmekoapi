const express = require("express");
const router = express.Router();
const {
  getUsersWithMostFans,
  getCreatorsWithMostViews,
  searchUsers,
  searchPostsByHashtags
} = require("../../../Controller/Discover/discover");

// Public routes - no authentication required
router.get("/top-fans", getUsersWithMostFans);
router.get("/top-views", getCreatorsWithMostViews);
router.get("/search-users", searchUsers);
router.get("/search-hashtags", searchPostsByHashtags);

module.exports = router;

