const reviewdb = require("../../Creators/review");
const userdb = require("../../Creators/userdb");
const creatorsdb = require("../../Creators/creators");
const admindb = require("../../Creators/admindb");
const { pushmessage } = require("../../utiils/sendPushnot");

// Submit a rating and feedback for a completed request
// Can be fan rating creator OR creator rating fan
exports.submitRating = async (req, res) => {
  const { requestId, creatorId, fanId, rating, feedback, hostType, ratingType } = req.body;

  
  try {
    // Validate required fields
    if (!requestId || !creatorId || !fanId || !rating || !feedback || !ratingType) {
      console.log('❌ [submitRating] Missing required fields:', {
        requestId: !!requestId,
        creatorId: !!creatorId,
        fanId: !!fanId,
        rating: !!rating,
        feedback: !!feedback,
        ratingType: !!ratingType
      });
      return res.status(400).json({
        ok: false,
        message: "Missing required fields: requestId, creatorId, fanId, rating, feedback, ratingType"
      });
    }

    // Validate ratingType
    if (!['fan-to-creator', 'creator-to-fan'].includes(ratingType)) {
      return res.status(400).json({
        ok: false,
        message: "ratingType must be either 'fan-to-creator' or 'creator-to-fan'"
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        ok: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if rating already exists for this request and rating type
    const existingRating = await reviewdb.findOne({ requestId, ratingType });
    if (existingRating) {
      return res.status(400).json({
        ok: false,
        message: `Rating already submitted for this request (${ratingType})`
      });
    }

    // Get user details based on rating type
    let raterUser, ratedUser;
    if (ratingType === 'fan-to-creator') {
      // Fan is rating creator
      console.log('🔍 [submitRating] Fan rating creator - looking up users:', { fanId, creatorId });
      raterUser = await userdb.findOne({ _id: fanId });
      // Try creators collection first, then users collection
      const creatorInCreators = await creatorsdb.findOne({ _id: creatorId });
      if (creatorInCreators) {
        console.log('✅ [submitRating] Creator found in creators collection');
        // Get the creator from userdb to get proper name fields
        ratedUser = await userdb.findOne({ _id: creatorId });
        if (ratedUser) {
          console.log('✅ [submitRating] Creator also found in users collection with name fields');
        } else {
          console.log('⚠️ [submitRating] Creator not found in users collection, using creators collection data');
          ratedUser = creatorInCreators;
        }
      } else {
        ratedUser = await userdb.findOne({ _id: creatorId });
        if (ratedUser) {
          console.log('✅ [submitRating] Creator found in users collection only');
        }
      }
      if (!raterUser) {
        console.log('❌ [submitRating] Fan not found:', fanId);
        return res.status(404).json({
          ok: false,
          message: "Fan not found"
        });
      }
      if (!ratedUser) {
        console.log('❌ [submitRating] Creator not found:', creatorId);
        return res.status(404).json({
          ok: false,
          message: "Creator not found"
        });
      }
    } else {
      // Creator is rating fan
      console.log('🔍 [submitRating] Creator rating fan - looking up users:', { creatorId, fanId });
      // Try creators collection first, then users collection
      const creatorInCreators = await creatorsdb.findOne({ _id: creatorId });
      if (creatorInCreators) {
        console.log('✅ [submitRating] Creator found in creators collection');
        // Get the creator from userdb to get proper name fields
        raterUser = await userdb.findOne({ _id: creatorId });
        if (raterUser) {
          console.log('✅ [submitRating] Creator also found in users collection with name fields');
        } else {
          console.log('⚠️ [submitRating] Creator not found in users collection, using creators collection data');
          raterUser = creatorInCreators;
        }
      } else {
        raterUser = await userdb.findOne({ _id: creatorId });
        if (raterUser) {
          console.log('✅ [submitRating] Creator found in users collection only');
        }
      }
      ratedUser = await userdb.findOne({ _id: fanId });
      if (!raterUser) {
        console.log('❌ [submitRating] Creator not found:', creatorId);
        return res.status(404).json({
          ok: false,
          message: "Creator not found"
        });
      }
      if (!ratedUser) {
        console.log('❌ [submitRating] Fan not found:', fanId);
        return res.status(404).json({
          ok: false,
          message: "Fan not found"
        });
      }
    }

    console.log('✅ [submitRating] Users found:', {
      raterUser: raterUser ? { 
        id: raterUser._id, 
        name: `${raterUser.firstname || raterUser.creatorname || raterUser.name || ''} ${raterUser.lastname || ''}`.trim(),
        collection: raterUser.creatorname || raterUser.name ? 'creators' : 'users',
        rawFields: { firstname: raterUser.firstname, creatorname: raterUser.creatorname, name: raterUser.name, lastname: raterUser.lastname }
      } : 'null',
      ratedUser: ratedUser ? { 
        id: ratedUser._id, 
        name: `${ratedUser.firstname || ratedUser.creatorname || ratedUser.name || ''} ${ratedUser.lastname || ''}`.trim(),
        collection: ratedUser.creatorname || ratedUser.name ? 'creators' : 'users',
        rawFields: { firstname: ratedUser.firstname, creatorname: ratedUser.creatorname, name: ratedUser.name, lastname: ratedUser.lastname }
      } : 'null'
    });

    // Create the rating record with dynamic fields based on rating type
    const ratingData = {
      requestId,
      creatorId,
      fanId,
      ratingType,
      rating,
      feedback,
      hostType: hostType || "Fan Meet",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add user details based on rating type (handle both users and creators collections)
    if (ratingType === 'fan-to-creator') {
      // Fan rating creator
      ratingData.fanName = `${raterUser.firstname || raterUser.creatorname || raterUser.name || ''} ${raterUser.lastname || ''}`.trim();
      ratingData.fanNickname = raterUser.nickname || raterUser.username || "";
      ratingData.fanPhoto = raterUser.photolink || "";
      ratingData.creatorName = `${ratedUser.firstname || ratedUser.creatorname || ratedUser.name || ''} ${ratedUser.lastname || ''}`.trim();
      ratingData.creatorNickname = ratedUser.nickname || ratedUser.username || "";
      ratingData.creatorPhoto = ratedUser.photolink || "";
    } else {
      // Creator rating fan
      ratingData.creatorName = `${raterUser.firstname || raterUser.creatorname || raterUser.name || ''} ${raterUser.lastname || ''}`.trim();
      ratingData.creatorNickname = raterUser.nickname || raterUser.username || "";
      ratingData.creatorPhoto = raterUser.photolink || "";
      ratingData.fanName = `${ratedUser.firstname || ratedUser.creatorname || ratedUser.name || ''} ${ratedUser.lastname || ''}`.trim();
      ratingData.fanNickname = ratedUser.nickname || ratedUser.username || "";
      ratingData.fanPhoto = ratedUser.photolink || "";
    }

    console.log('💾 [submitRating] Creating rating record:', ratingData);
    const savedRating = await reviewdb.create(ratingData);
    console.log('✅ [submitRating] Rating saved successfully:', savedRating._id);

    // Send notifications based on rating type
    if (ratingType === 'fan-to-creator') {
      // Fan rated creator - notify creator
      console.log('📱 [submitRating] Sending notification to creator:', creatorId);
      const raterName = raterUser.firstname || raterUser.creatorname || raterUser.name || 'User';
      await pushmessage(creatorId, `You received a ${rating}-star rating from ${raterName}!`, "creatoricon");
      await admindb.create({
        userid: creatorId,
        message: `You received a ${rating}-star rating from ${raterName} ${raterUser.lastname || ''}`.trim(),
        seen: false
      });
    } else {
      // Creator rated fan - notify fan
      console.log('📱 [submitRating] Sending notification to fan:', fanId);
      const raterName = raterUser.firstname || raterUser.creatorname || raterUser.name || 'User';
      await pushmessage(fanId, `You received a ${rating}-star rating from ${raterName}!`, "fanicon");
      await admindb.create({
        userid: fanId,
        message: `You received a ${rating}-star rating from ${raterName} ${raterUser.lastname || ''}`.trim(),
        seen: false
      });
    }

    console.log('🎉 [submitRating] Rating submission completed successfully');
    return res.status(200).json({
      ok: true,
      message: "Rating submitted successfully",
      rating: savedRating
    });

  } catch (error) {
    console.error("❌ [submitRating] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return res.status(500).json({
      ok: false,
      message: "Failed to submit rating",
      error: error.message
    });
  }
};

// Check if a user has already rated a specific request
exports.checkUserRating = async (req, res) => {
  const { requestId, userId, ratingType } = req.params;

  try {
    if (!requestId || !userId || !ratingType) {
      return res.status(400).json({
        ok: false,
        message: "request ID, User ID, and Rating Type are required"
      });
    }

    // Validate ratingType
    if (!['fan-to-creator', 'creator-to-fan'].includes(ratingType)) {
      return res.status(400).json({
        ok: false,
        message: "ratingType must be either 'fan-to-creator' or 'creator-to-fan'"
      });
    }

    // Check if rating exists for this request by this user and rating type
    const existingRating = await reviewdb.findOne({ requestId, ratingType });
    
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

// Get ratings for a specific creator or fan
exports.getCreatorRatings = async (req, res) => {
  const { userId, ratingType } = req.params;

  try {
    if (!userId || !ratingType) {
      return res.status(400).json({
        ok: false,
        message: "User ID and Rating Type are required"
      });
    }

    // Validate ratingType
    if (!['fan-to-creator', 'creator-to-fan'].includes(ratingType)) {
      return res.status(400).json({
        ok: false,
        message: "ratingType must be either 'fan-to-creator' or 'creator-to-fan'"
      });
    }

    // Get all ratings for this user based on rating type
    let query = { ratingType };
    if (ratingType === 'fan-to-creator') {
      // Get ratings where this user is the creator (being rated)
      query.creatorId = userId;
    } else {
      // Get ratings where this user is the fan (being rated)
      query.fanId = userId;
    }

    const ratings = await reviewdb.find(query).sort({ createdAt: -1 });

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
