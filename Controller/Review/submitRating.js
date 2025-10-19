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
      ratingData.fanIsVip = raterUser.isVip || false;
      ratingData.fanVipEndDate = raterUser.vipEndDate || null;
      ratingData.creatorName = `${ratedUser.firstname || ratedUser.creatorname || ratedUser.name || ''} ${ratedUser.lastname || ''}`.trim();
      ratingData.creatorNickname = ratedUser.nickname || ratedUser.username || "";
      ratingData.creatorPhoto = ratedUser.photolink || "";
      ratingData.creatorIsVip = ratedUser.isVip || false;
      ratingData.creatorVipEndDate = ratedUser.vipEndDate || null;
    } else {
      // Creator rating fan
      ratingData.creatorName = `${raterUser.firstname || raterUser.creatorname || raterUser.name || ''} ${raterUser.lastname || ''}`.trim();
      ratingData.creatorNickname = raterUser.nickname || raterUser.username || "";
      ratingData.creatorPhoto = raterUser.photolink || "";
      ratingData.creatorIsVip = raterUser.isVip || false;
      ratingData.creatorVipEndDate = raterUser.vipEndDate || null;
      ratingData.fanName = `${ratedUser.firstname || ratedUser.creatorname || ratedUser.name || ''} ${ratedUser.lastname || ''}`.trim();
      ratingData.fanNickname = ratedUser.nickname || ratedUser.username || "";
      ratingData.fanPhoto = ratedUser.photolink || "";
      ratingData.fanIsVip = ratedUser.isVip || false;
      ratingData.fanVipEndDate = ratedUser.vipEndDate || null;
    }

    console.log('💾 [submitRating] Creating rating record with VIP data:', {
      ratingType,
      fanIsVip: ratingData.fanIsVip,
      fanVipEndDate: ratingData.fanVipEndDate,
      creatorIsVip: ratingData.creatorIsVip,
      creatorVipEndDate: ratingData.creatorVipEndDate,
      fanName: ratingData.fanName,
      creatorName: ratingData.creatorName
    });
    const savedRating = await reviewdb.create(ratingData);
    console.log('✅ [submitRating] Rating saved successfully with VIP data:', {
      id: savedRating._id,
      fanIsVip: savedRating.fanIsVip,
      creatorIsVip: savedRating.creatorIsVip
    });

    // Send notifications based on rating type
    if (ratingType === 'fan-to-creator') {
      // Fan rated creator - notify creator
      console.log('📱 [submitRating] Sending notification to creator:', creatorId);
      const raterName = raterUser.firstname || raterUser.creatorname || raterUser.name || 'User';
      await pushmessage(creatorId, `You received a ${rating}-star rating from ${raterName}!`, "/icons/m-logo.png");
      await admindb.create({
        userid: creatorId,
        message: `You received a ${rating}-star rating from ${raterName} ${raterUser.lastname || ''}`.trim(),
        seen: false
      });
    } else {
      // Creator rated fan - notify fan
      console.log('📱 [submitRating] Sending notification to fan:', fanId);
      const raterName = raterUser.firstname || raterUser.creatorname || raterUser.name || 'User';
      await pushmessage(fanId, `You received a ${rating}-star rating from ${raterName}!`, "/icons/m-logo.png");
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

// Get ALL ratings for a specific creator portfolio (both fan-to-creator and creator-to-creator)
exports.getAllCreatorRatings = async (req, res) => {
  const { creatorId } = req.params;

  try {
    console.log('🔍 [getAllCreatorRatings] Backend called with creatorId:', creatorId);
    
    if (!creatorId) {
      return res.status(400).json({
        ok: false,
        message: "Creator ID is required"
      });
    }

    // Get ALL ratings where this creator is being rated (both fan-to-creator and creator-to-creator)
    let query = {
      $or: [
        { creatorId: creatorId, ratingType: 'fan-to-creator' }, // Ratings from fans
        { creatorId: creatorId, ratingType: 'creator-to-creator' } // Ratings from other creators
      ]
    };

    console.log('🔍 [getAllCreatorRatings] Query:', JSON.stringify(query, null, 2));
    let ratings = await reviewdb.find(query).sort({ createdAt: -1 });
    console.log('🔍 [getAllCreatorRatings] Found ratings count:', ratings.length);

    // Update ratings with VIP data if missing
    const updatedRatings = [];
    for (const rating of ratings) {
      let needsUpdate = false;
      const updateData = {};
      
      // Check if fan VIP data is missing
      if (rating.fanIsVip === undefined || rating.fanIsVip === null) {
        const fanUser = await userdb.findOne({ _id: rating.fanId });
        if (fanUser) {
          updateData.fanIsVip = fanUser.isVip || false;
          updateData.fanVipEndDate = fanUser.vipEndDate || null;
          needsUpdate = true;
        }
      }
      
      // Check if creator VIP data is missing
      if (rating.creatorIsVip === undefined || rating.creatorIsVip === null) {
        let creatorUser = await userdb.findOne({ _id: rating.creatorId });
        if (!creatorUser) {
          creatorUser = await creatorsdb.findOne({ _id: rating.creatorId });
          if (creatorUser) {
            const creatorFromUserdb = await userdb.findOne({ _id: rating.creatorId });
            if (creatorFromUserdb) {
              creatorUser = creatorFromUserdb;
            }
          }
        }
        if (creatorUser) {
          updateData.creatorIsVip = creatorUser.isVip || false;
          updateData.creatorVipEndDate = creatorUser.vipEndDate || null;
          needsUpdate = true;
        }
      }
      
      // Update the rating if needed
      if (needsUpdate) {
        await reviewdb.updateOne({ _id: rating._id }, { $set: updateData });
        console.log(`🔄 [getCreatorRatings] Updated rating ${rating._id} with VIP data:`, updateData);
        
        // Update the local rating object
        const updatedRating = { ...rating.toObject(), ...updateData };
        updatedRatings.push(updatedRating);
      } else {
        updatedRatings.push(rating);
      }
    }
    
    ratings = updatedRatings;

    // Debug log to see VIP data in ratings
    console.log('🔍 [getAllCreatorRatings] Found ratings with VIP data:', ratings.map(r => ({
      id: r._id,
      ratingType: r.ratingType,
      fanIsVip: r.fanIsVip,
      fanVipEndDate: r.fanVipEndDate,
      creatorIsVip: r.creatorIsVip,
      creatorVipEndDate: r.creatorVipEndDate,
      fanName: r.fanName,
      creatorName: r.creatorName
    })));

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
    
    console.log('✅ [getAllCreatorRatings] Sending response:', {
      ok: response.ok,
      totalRatings: response.totalRatings,
      averageRating: response.averageRating,
      ratingsCount: response.ratings.length
    });
    
    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch ratings",
      error: error.message
    });
  }
}

// Get ALL ratings for a specific user (for user profile page)
exports.getAllUserRatings = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({
        ok: false,
        message: "User ID is required"
      });
    }

    // Get ALL ratings where this user is involved (as creator or fan)
    let query = {
      $or: [
        { creatorId: userId }, // User is the creator being rated
        { fanId: userId }      // User is the fan being rated
      ]
    };

    let ratings = await reviewdb.find(query).sort({ createdAt: -1 });

    // Update ratings with VIP data if missing
    const updatedRatings = [];
    for (const rating of ratings) {
      let needsUpdate = false;
      const updateData = {};
      
      if (rating.fanIsVip === undefined || rating.fanIsVip === null) {
        const fanUser = await userdb.findOne({ _id: rating.fanId });
        if (fanUser) {
          updateData.fanIsVip = fanUser.isVip || false;
          updateData.fanVipEndDate = fanUser.vipEndDate || null;
          needsUpdate = true;
        }
      }
      
      if (rating.creatorIsVip === undefined || rating.creatorIsVip === null) {
        let creatorUser = await userdb.findOne({ _id: rating.creatorId });
        if (!creatorUser) {
          creatorUser = await creatorsdb.findOne({ _id: rating.creatorId });
          if (creatorUser) {
            const creatorFromUserdb = await userdb.findOne({ _id: rating.creatorId });
            if (creatorFromUserdb) {
              creatorUser = creatorFromUserdb;
            }
          }
        }
        if (creatorUser) {
          updateData.creatorIsVip = creatorUser.isVip || false;
          updateData.creatorVipEndDate = creatorUser.vipEndDate || null;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await reviewdb.updateOne({ _id: rating._id }, { $set: updateData });
        console.log(`🔄 [getAllUserRatings] Updated rating ${rating._id} with VIP data:`, updateData);
        const updatedRating = { ...rating.toObject(), ...updateData };
        updatedRatings.push(updatedRating);
      } else {
        updatedRatings.push(rating);
      }
    }
    
    ratings = updatedRatings;

    // Debug log to see VIP data in ratings
    console.log('🔍 [getAllUserRatings] Found ratings with VIP data:', ratings.map(r => ({
      id: r._id,
      ratingType: r.ratingType,
      fanIsVip: r.fanIsVip,
      fanVipEndDate: r.fanVipEndDate,
      creatorIsVip: r.creatorIsVip,
      creatorVipEndDate: r.creatorVipEndDate,
      fanName: r.fanName,
      creatorName: r.creatorName
    })));

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
}

// Get ratings for a specific creator or fan (original function)
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

    let ratings = await reviewdb.find(query).sort({ createdAt: -1 });

    // Update ratings with VIP data if missing
    const updatedRatings = [];
    for (const rating of ratings) {
      let needsUpdate = false;
      const updateData = {};
      
      if (rating.fanIsVip === undefined || rating.fanIsVip === null) {
        const fanUser = await userdb.findOne({ _id: rating.fanId });
        if (fanUser) {
          updateData.fanIsVip = fanUser.isVip || false;
          updateData.fanVipEndDate = fanUser.vipEndDate || null;
          needsUpdate = true;
        }
      }
      
      if (rating.creatorIsVip === undefined || rating.creatorIsVip === null) {
        let creatorUser = await userdb.findOne({ _id: rating.creatorId });
        if (!creatorUser) {
          creatorUser = await creatorsdb.findOne({ _id: rating.creatorId });
          if (creatorUser) {
            const creatorFromUserdb = await userdb.findOne({ _id: rating.creatorId });
            if (creatorFromUserdb) {
              creatorUser = creatorFromUserdb;
            }
          }
        }
        if (creatorUser) {
          updateData.creatorIsVip = creatorUser.isVip || false;
          updateData.creatorVipEndDate = creatorUser.vipEndDate || null;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await reviewdb.updateOne({ _id: rating._id }, { $set: updateData });
        console.log(`🔄 [getCreatorRatings] Updated rating ${rating._id} with VIP data:`, updateData);
        const updatedRating = { ...rating.toObject(), ...updateData };
        updatedRatings.push(updatedRating);
      } else {
        updatedRatings.push(rating);
      }
    }
    
    ratings = updatedRatings;

    // Debug log to see VIP data in ratings
    console.log('🔍 [getCreatorRatings] Found ratings with VIP data:', ratings.map(r => ({
      id: r._id,
      ratingType: r.ratingType,
      fanIsVip: r.fanIsVip,
      fanVipEndDate: r.fanVipEndDate,
      creatorIsVip: r.creatorIsVip,
      creatorVipEndDate: r.creatorVipEndDate,
      fanName: r.fanName,
      creatorName: r.creatorName
    })));

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
