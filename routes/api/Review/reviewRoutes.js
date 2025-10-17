const express = require("express");
const router = express.Router();
const { submitRating, getCreatorRatings, getAllCreatorRatings, getAllUserRatings, checkUserRating } = require("../../../Controller/Review/submitRating");

// Submit a rating for a completed request
router.post("/submit", submitRating);

// Get ALL ratings for a specific creator portfolio (both fan-to-creator and creator-to-creator)
router.get("/creator/:creatorId/all", getAllCreatorRatings);

// Get ALL ratings for a specific user (for user profile page)
router.get("/user/:userId/all", getAllUserRatings);

// Get ratings for a specific creator or fan
router.get("/user/:userId/:ratingType", getCreatorRatings);

// Check if a user has already rated a specific request
router.get("/check/:requestId/:userId/:ratingType", checkUserRating);

module.exports = router;
