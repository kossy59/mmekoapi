const userdb = require("../../Creators/userdb")
let userphoto = require("../../Creators/usercomplete")
const { filterBlockedUsers } = require("../../utiils/blockFilter")
const websiteVisitor = require("../../Creators/websiteVisitor")
const requestdb = require("../../Creators/requsts")
const creatordb = require("../../Creators/creators")

const updatePost = async (req, res) => {
  const userid = req.body.userid;

  try {
    // Get all users with ban status included
    let du = await userdb.find({}).exec()
    let photos = await userphoto.find({}).exec()

    let alluser = []

    // Process users and add photo links
    du.forEach(value1 => {
      photos.forEach(value2 => {
        if (String(value1._id) === String(value2.useraccountId)) {
          let obj = value1.toObject()
          obj.photolink = value2.photoLink
          alluser.push(obj)
        }
      })
    })

    // Add IP addresses from websiteVisitor collection
    // Get latest visitor record for each user to get their IP address
    for (let i = 0; i < alluser.length; i++) {
      try {
        const latestVisitor = await websiteVisitor.findOne({
          userid: alluser[i]._id.toString(),
        }).sort({ date: -1 }).exec();

        if (latestVisitor && latestVisitor.location && latestVisitor.location.ipAddress) {
          alluser[i].ipAddress = latestVisitor.location.ipAddress;
        } else {
          alluser[i].ipAddress = "Unknown";
        }
      } catch (err) {
        console.error(`Error fetching IP for user ${alluser[i]._id}:`, err);
        alluser[i].ipAddress = "Unknown";
      }
    }

    // Add request statistics for each user
    for (let i = 0; i < alluser.length; i++) {
      const userIdStr = alluser[i]._id.toString();

      try {
        // Get requests made by this user (as a fan)
        const requestsMade = await requestdb.find({
          userid: userIdStr,
          creator_portfolio_id: { $exists: true, $ne: null, $ne: "" }
        }).exec();

        // Get creator portfolio for this user
        const creatorPortfolio = await creatordb.findOne({ userid: userIdStr }).exec();

        let requestsReceived = [];
        let isCreator = false;

        if (creatorPortfolio) {
          isCreator = true;
          // Get requests received by this creator
          requestsReceived = await requestdb.find({
            creator_portfolio_id: creatorPortfolio._id.toString(),
            userid: { $exists: true, $ne: null, $ne: "" }
          }).exec();
        }

        // Process requests made - group by creator and type
        const requestsMadeDetails = [];
        const requestsMadeByType = {};

        for (const request of requestsMade) {
          try {
            const creator = await creatordb.findOne({ _id: request.creator_portfolio_id }).exec();
            const creatorUser = creator ? await userdb.findOne({ _id: creator.userid }).exec() : null;

            requestsMadeDetails.push({
              requestId: request._id,
              creatorName: creator?.name || 'Unknown',
              creatorUsername: creatorUser?.username || 'Unknown',
              type: request.type || 'Unknown',
              status: request.status,
              date: request.date,
              price: request.price,
              createdAt: request.createdAt
            });

            // Count by type
            const requestType = request.type || 'Unknown';
            requestsMadeByType[requestType] = (requestsMadeByType[requestType] || 0) + 1;
          } catch (err) {
            console.error(`Error processing request ${request._id}:`, err);
          }
        }

        // Process requests received - group by type
        const requestsReceivedByType = {};
        const requestsReceivedByStatus = {};

        for (const request of requestsReceived) {
          const requestType = request.type || 'Unknown';
          const requestStatus = request.status || 'pending';

          requestsReceivedByType[requestType] = (requestsReceivedByType[requestType] || 0) + 1;
          requestsReceivedByStatus[requestStatus] = (requestsReceivedByStatus[requestStatus] || 0) + 1;
        }

        // Add request statistics to user object
        alluser[i].isCreator = isCreator;
        alluser[i].creatorPortfolioId = creatorPortfolio?._id || null;

        // Requests made statistics
        alluser[i].requestsMadeCount = requestsMade.length;
        alluser[i].requestsMadeByType = requestsMadeByType;
        alluser[i].requestsMadeDetails = requestsMadeDetails;

        // Requests received statistics (only if creator)
        if (isCreator) {
          alluser[i].requestsReceivedCount = requestsReceived.length;
          alluser[i].requestsReceivedByType = requestsReceivedByType;
          alluser[i].requestsReceivedByStatus = requestsReceivedByStatus;
        } else {
          alluser[i].requestsReceivedCount = 0;
          alluser[i].requestsReceivedByType = {};
          alluser[i].requestsReceivedByStatus = {};
        }

      } catch (err) {
        console.error(`Error fetching requests for user ${userIdStr}:`, err);
        // Set default values if error occurs
        alluser[i].isCreator = false;
        alluser[i].requestsMadeCount = 0;
        alluser[i].requestsReceivedCount = 0;
        alluser[i].requestsMadeByType = {};
        alluser[i].requestsReceivedByType = {};
        alluser[i].requestsMadeDetails = [];
      }
    }

    // Filter out blocked users from the alluser list
    const filteredUsers = await filterBlockedUsers(alluser, userid);

    return res.status(200).json({ "ok": true, "message": `Fetched all users Successfully`, users: filteredUsers })


  } catch (err) {
    return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
  }
}

module.exports = updatePost
