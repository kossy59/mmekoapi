const requestdb = require("../../Creators/requsts");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");

const getAllFanRequests = async (req, res) => {
  const { userid } = req.body;

  if (!userid) {
    return res.status(400).json({
      ok: false,
      message: "User ID is required"
    });
  }

  try {
    // Get all requests where user is either the fan or creator
    // Filter out requests with missing required fields
    const fanRequests = await requestdb.find({ 
      userid: userid,
      creator_portfolio_id: { $exists: true, $ne: null, $ne: "" }
    })
      .sort({ createdAt: -1 })
      .exec();

    // For creator requests, we need to find the creator's hostid first
    const creator = await creatordb.findOne({ userid: userid }).exec();
    
    let creatorRequests = [];
    
    if (creator) {
      creatorRequests = await requestdb.find({ 
        creator_portfolio_id: creator._id,
        userid: { $exists: true, $ne: null, $ne: "" }
      })
        .sort({ createdAt: -1 })
        .exec();
    }


    // Mark the source of each request (keep as Mongoose documents for now)
    const fanRequestsWithRole = fanRequests.map(req => ({ ...req.toObject(), _userRole: 'fan', _mongooseDoc: req }));
    const creatorRequestsWithRole = creatorRequests.map(req => ({ ...req.toObject(), _userRole: 'creator', _mongooseDoc: req }));

    // Combine and deduplicate requests
    const allRequests = [...fanRequestsWithRole, ...creatorRequestsWithRole];
    
    const uniqueRequests = allRequests.filter((request, index, self) => 
      index === self.findIndex(r => r._id.toString() === request._id.toString())
    );

    // Pre-fetch all creator data to avoid multiple database calls
    const creatorPortfolioIds = uniqueRequests
      .filter(req => req._userRole === 'fan')
      .map(req => req.creator_portfolio_id);
    
    const creatorDataMap = new Map();
    if (creatorPortfolioIds.length > 0) {
      const creatorDataList = await creatordb.find({ _id: { $in: creatorPortfolioIds } }).exec();
      creatorDataList.forEach(creator => {
        creatorDataMap.set(creator._id.toString(), creator);
      });
    }

    // Enrich requests with user/creator details
    const enrichedRequests = await Promise.all(
      uniqueRequests.map(async (request) => {
        // Use the pre-determined role from the query
        const userRole = request._userRole;
        
        
        const isCreator = userRole === 'creator';
        const isFan = userRole === 'fan';
        
        let otherUser;
        let userType;
        
                if (isCreator) {
                  // Current user is creator, get fan details
                  otherUser = await userdb.findOne({ _id: request.userid }).exec();
                  userType = 'creator';
                } else if (isFan) {
                  // Current user is fan, get creator details
                  const creatorData = creatorDataMap.get(request.creator_portfolio_id.toString());
                  // Also get the creator's user data for VIP status
                  const creatorUserData = await userdb.findOne({ _id: creatorData?.userid }).exec();
                  
                  // Combine creator data with user VIP data
                  otherUser = {
                    ...creatorData?.toObject(),
                    isVip: creatorUserData?.isVip || false,
                    vipEndDate: creatorUserData?.vipEndDate
                  };
                  userType = 'fan';
                } else {
                  // Fallback - shouldn't happen
                  userType = 'fan';
                }

        // Calculate time remaining for pending and accepted requests
        let timeRemaining = null;
        const now = new Date();
        
        if (request.status === 'request' && request.expiresAt) {
          // Handle pending requests with expiresAt
          const expiresAt = new Date(request.expiresAt);
          const diffMs = expiresAt.getTime() - now.getTime();
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            timeRemaining = `${hours}h, ${minutes}m, ${seconds}s`;
          } else {
            // Request has expired, update status
            if (request._mongooseDoc && request._mongooseDoc.status !== 'expired') {
              // Only save if required fields are present
              if (request._mongooseDoc.creator_portfolio_id && request._mongooseDoc.userid) {
                request._mongooseDoc.status = 'expired';
                await request._mongooseDoc.save();
              }
            }
            timeRemaining = 'Expired';
          }
        } else if (request.status === 'accepted') {
          // Handle accepted requests - different expiration times based on type
          let expirationTime;
          if (request.type === 'Fan Call') {
            // Fan Call expires after 48 hours
            expirationTime = new Date(request.createdAt.getTime() + (48 * 60 * 60 * 1000));
          } else {
            // Other types expire after 7 days
            expirationTime = new Date(request.createdAt.getTime() + (7 * 24 * 60 * 60 * 1000));
          }
          
          const diffMs = expirationTime.getTime() - now.getTime();
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            timeRemaining = `${hours}h, ${minutes}m, ${seconds}s`;
          } else {
            // Request has expired, update status
            if (request._mongooseDoc && request._mongooseDoc.status !== 'expired') {
              // Only save if required fields are present
              if (request._mongooseDoc.creator_portfolio_id && request._mongooseDoc.userid) {
                request._mongooseDoc.status = 'expired';
                await request._mongooseDoc.save();
              }
            }
            timeRemaining = 'Expired';
          }
        }

        // Determine the target user ID for profile navigation
        let targetUserId;
        if (isCreator) {
          // Current user is creator, target user is the fan
          // The fan's user ID is in request.userid
          targetUserId = request.userid;
        } else if (isFan) {
          // Current user is fan, target user is the creator
          // Get creator's user ID from the pre-fetched creator data
          const creatorData = creatorDataMap.get(request.creator_portfolio_id.toString());
          if (creatorData && creatorData.userid) {
            targetUserId = creatorData.userid;
          }
        }

        return {
          id: request._id,
          requestId: request._id,
          type: userType, // 'creator' or 'fan'
          date: request.date,
          time: request.time,
          place: request.place,
          status: request.status,
          price: request.price,
          timeRemaining,
          userid: request.userid,
          creator_portfolio_id: request.creator_portfolio_id,
          targetUserId: targetUserId, // Add target user ID for profile navigation
          hosttype: request.type, // Use request's type field which contains the host type
          otherUser: otherUser ? {
            name: otherUser.name || `${otherUser.firstname || ''} ${otherUser.lastname || ''}`.trim() || 'Unknown User',
            photolink: otherUser.photolink || '/picture-1.jfif',
            isCreator: userType === 'fan', // If current user is fan, other user is creator
            isVip: otherUser.isVip || false, // Include VIP status
            vipEndDate: otherUser.vipEndDate // Include VIP end date
          } : {
            name: 'Unknown User',
            photolink: '/picture-1.jfif',
            isCreator: userType === 'fan',
            isVip: false,
            vipEndDate: null
          },
          createdAt: request.createdAt,
          expiresAt: request.expiresAt
        };
      })
    );

    return res.status(200).json({
      ok: true,
      requests: enrichedRequests
    });

  } catch (err) {
      console.error("Error getting fan requests:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = getAllFanRequests;
