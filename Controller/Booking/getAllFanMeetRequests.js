const bookingdb = require("../../Creators/book");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");

const getAllFanMeetRequests = async (req, res) => {
  const { userid } = req.body;

  if (!userid) {
    return res.status(400).json({
      ok: false,
      message: "User ID is required"
    });
  }

  try {
    // Get all requests where user is either the fan or creator
    const fanRequests = await bookingdb.find({ userid: userid })
      .sort({ createdAt: -1 })
      .exec();

    // For creator requests, we need to find the creator's hostid first
    const creator = await creatordb.findOne({ userid: userid }).exec();
    let creatorRequests = [];
    
    if (creator) {
      creatorRequests = await bookingdb.find({ creatorid: creator._id })
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
                  otherUser = await creatordb.findOne({ _id: request.creatorid }).exec();
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
              request._mongooseDoc.status = 'expired';
              await request._mongooseDoc.save();
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
              request._mongooseDoc.status = 'expired';
              await request._mongooseDoc.save();
            }
            timeRemaining = 'Expired';
          }
        }

        return {
          id: request._id,
          bookingId: request._id,
          type: userType, // 'creator' or 'fan'
          date: request.date,
          time: request.time,
          place: request.place,
          status: request.status,
          price: request.price,
          timeRemaining,
          userid: request.userid,
          creatorid: request.creatorid,
          hosttype: request.type, // Use booking's type field which contains the host type
          otherUser: otherUser ? {
            name: otherUser.name || `${otherUser.firstname || ''} ${otherUser.lastname || ''}`.trim() || 'Unknown User',
            photolink: otherUser.photolink || '/picture-1.jfif',
            isCreator: userType === 'fan' // If current user is fan, other user is creator
          } : {
            name: 'Unknown User',
            photolink: '/picture-1.jfif',
            isCreator: userType === 'fan'
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
    console.error("Error getting fan meet requests:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`
    });
  }
};

module.exports = getAllFanMeetRequests;
