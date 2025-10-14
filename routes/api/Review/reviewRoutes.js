const express = require("express");
const router = express.Router();
const { submitRating, getCreatorRatings, checkUserRating } = require("../../../Controller/Review/submitRating");

// Submit a rating for a completed booking
router.post("/submit", submitRating);

// Get ratings for a specific creator
router.get("/creator/:creatorId", getCreatorRatings);

// Check if a user has already rated a specific booking
router.get("/check/:bookingId/:fanId", checkUserRating);

module.exports = router;
