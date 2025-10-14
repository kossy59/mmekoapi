const reviewdb = require("../../Creators/review");
const userdb = require("../../Creators/userdb");
const admindb = require("../../Creators/admindb");
const { pushmessage } = require("../../utiils/sendPushnot");

// Submit a rating and feedback for a completed booking
exports.submitRating = async (req, res) => {
  const { bookingId, creatorId, fanId, rating, feedback, hostType } = req.body;

  try {
    // Validate required fields
    if (!bookingId || !creatorId || !fanId || !rating || !feedback) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields: bookingId, creatorId, fanId, rating, feedback"
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        ok: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if rating already exists for this booking
    const existingRating = await reviewdb.findOne({ bookingId });
    if (existingRating) {
      return res.status(400).json({
        ok: false,
        message: "Rating already submitted for this booking"
      });
    }

    // Get fan details for the review
    const fan = await userdb.findOne({ _id: fanId });
    if (!fan) {
      return res.status(404).json({
        ok: false,
        message: "Fan not found"
      });
    }

    // Create the rating record
    const ratingData = {
      bookingId,
      creatorId,
      fanId,
      fanName: `${fan.firstname} ${fan.lastname}`,
      fanNickname: fan.nickname || fan.username,
      fanPhoto: fan.photolink || "",
      rating,
      feedback,
      hostType: hostType || "Fan Meet",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedRating = await reviewdb.create(ratingData);

    // Send notification to creator about the new rating
    await pushmessage(creatorId, `You received a ${rating}-star rating from ${fan.firstname}!`, "creatoricon");

    // Create database notification for creator
    await admindb.create({
      userid: creatorId,
      message: `You received a ${rating}-star rating from ${fan.firstname} ${fan.lastname}`,
      seen: false
    });

    return res.status(200).json({
      ok: true,
      message: "Rating submitted successfully",
      rating: savedRating
    });

  } catch (error) {
    console.error("[submitRating] Error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to submit rating",
      error: error.message
    });
  }
};

// Check if a user has already rated a specific booking
exports.checkUserRating = async (req, res) => {
  const { bookingId, fanId } = req.params;

  try {
    if (!bookingId || !fanId) {
      return res.status(400).json({
        ok: false,
        message: "Booking ID and Fan ID are required"
      });
    }

    // Check if rating exists for this booking by this fan
    const existingRating = await reviewdb.findOne({ bookingId, fanId });
    
    if (existingRating) {
      return res.status(200).json({
        ok: true,
        hasRated: true,
        rating: existingRating.rating,
        feedback: existingRating.feedback,
        createdAt: existingRating.createdAt
      });
    } else {
      return res.status(200).json({
        ok: true,
        hasRated: false
      });
    }

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to check rating",
      error: error.message
    });
  }
};

// Get ratings for a specific creator
exports.getCreatorRatings = async (req, res) => {
  const { creatorId } = req.params;

  try {
    if (!creatorId) {
      return res.status(400).json({
        ok: false,
        message: "Creator ID is required"
      });
    }

    // Get all ratings for this creator, sorted by newest first
    const ratings = await reviewdb.find({ creatorId }).sort({ createdAt: -1 });

    // Calculate average rating
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
      : 0;

    // Count ratings by star
    const ratingCounts = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length
    };

    const response = {
      ok: true,
      ratings,
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      ratingCounts
    };
    
    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch ratings",
      error: error.message
    });
  }
};
