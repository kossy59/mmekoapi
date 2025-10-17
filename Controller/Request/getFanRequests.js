const requestdb = require("../../Creators/requsts");
const userdb = require("../../Creators/userdb");
const creatordb = require("../../Creators/creators");

const getFanRequests = async (req, res) => {
  const { userid, type } = req.query; // type: 'fan' or 'creator'

  if (!userid || !type) {
    return res.status(400).json({
      ok: false,
      message: "User ID and type are required"
    });
  }

  try {
    let query = {};
    
    if (type === 'fan') {
      query = { userid: userid };
    } else if (type === 'creator') {
      query = { creator_portfolio_id: userid };
    } else {
      return res.status(400).json({
        ok: false,
        message: "Type must be 'fan' or 'creator'"
      });
    }

    // Get all requests for the user
    const requests = await requestdb.find(query)
      .sort({ createdAt: -1 })
      .exec();

    // Enrich requests with user/creator details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        let otherUser;
        if (type === 'fan') {
          otherUser = await creatordb.findOne({ _id: request.creator_portfolio_id }).exec();
        } else {
          otherUser = await userdb.findOne({ _id: request.userid }).exec();
        }

        // Calculate time remaining for pending requests
        let timeRemaining = null;
        if (request.status === 'request' && request.expiresAt) {
          const now = new Date();
          const expiresAt = new Date(request.expiresAt);
          const diffMs = expiresAt.getTime() - now.getTime();
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            timeRemaining = `${hours}h, ${minutes}m, ${seconds}s`;
          } else {
            // Request has expired, update status
            request.status = 'expired';
            await request.save();
            timeRemaining = 'Expired';
          }
        }

        return {
          id: request._id,
          requestId: request._id,
          type: request.type,
          date: request.date,
          time: request.time,
          place: request.place,
          status: request.status,
          price: request.price,
          timeRemaining,
          otherUser: otherUser ? {
            name: otherUser.name || `${otherUser.firstname} ${otherUser.lastname}`,
            nickname: otherUser.nickname, // Include nickname field
            photolink: otherUser.photolink,
            isCreator: type === 'fan'
          } : null,
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

module.exports = getFanRequests;
