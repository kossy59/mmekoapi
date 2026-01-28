const userdb = require("../../Creators/userdb")
const mongoose = require("mongoose")
let userphoto = require("../../Creators/usercomplete")
const { filterBlockedUsers } = require("../../utiils/blockFilter")

const updatePost = async (req, res) => {
  const userid = req.body.userid;
  const page = parseInt(req.body.page) || 1;
  const id = req.body._id || req.body.id || "";
  const limit = parseInt(req.body.limit) || 20;
  const search = req.body.search || "";
  const gender = req.body.gender || "";
  const filter = req.body.filter || ""; // 'admin', 'creator', 'vip'
  const includeStats = req.body.includeStats === true;

  try {
    // Build search query
    const searchQuery = {};

    // Direct ID fetch
    if (id) {
      searchQuery._id = new mongoose.Types.ObjectId(id);
    }


    // Text search
    if (search) {
      searchQuery.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Gender filter
    if (gender && gender !== 'all') {
      searchQuery.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
    }

    // Role/Status filter
    if (filter === 'admin') {
      searchQuery.admin = true;
    } else if (filter === 'creator') {
      searchQuery.creator_verified = true;
    } else if (filter === 'vip') {
      searchQuery.isVip = true;
    }

    // Get total count for pagination
    const totalUsers = await userdb.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    // Use aggregation pipeline for optimized querying
    const pipeline = [
      { $match: searchQuery },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'usercompletes', // Collection name for userphoto
          localField: '_id',
          foreignField: 'useraccountId',
          as: 'photoData'
        }
      },
      {
        $addFields: {
          photolink: {
            $cond: {
              if: { $gt: [{ $size: '$photoData' }, 0] },
              then: { $arrayElemAt: ['$photoData.photoLink', 0] },
              else: null
            }
          }
        }
      },
      {
        $project: {
          photoData: 0, // Remove temporary field
          password: 0,  // Don't send password
          __v: 0        // Don't send version
        }
      }
    ];

    // Only add IP and request stats if explicitly requested (for detail view)
    if (includeStats) {
      // Add websiteVisitor lookup for IP addresses
      pipeline.push({
        $lookup: {
          from: 'websitevisitors',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$userid', '$$userId'] } } },
            { $sort: { date: -1 } },
            { $limit: 1 },
            { $project: { 'location.ipAddress': 1 } }
          ],
          as: 'visitorData'
        }
      });

      pipeline.push({
        $addFields: {
          ipAddress: {
            $cond: {
              if: { $gt: [{ $size: '$visitorData' }, 0] },
              then: { $arrayElemAt: ['$visitorData.location.ipAddress', 0] },
              else: 'Unknown'
            }
          }
        }
      });

      // Add request statistics
      pipeline.push({
        $lookup: {
          from: 'requests',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$userid', '$$userId'] } } },
            { $count: 'count' }
          ],
          as: 'requestsMadeData'
        }
      });

      pipeline.push({
        $lookup: {
          from: 'creators',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$userid', '$$userId'] } } },
            { $limit: 1 },
            { $project: { _id: 1 } }
          ],
          as: 'creatorData'
        }
      });

      pipeline.push({
        $addFields: {
          requestsMadeCount: {
            $cond: {
              if: { $gt: [{ $size: '$requestsMadeData' }, 0] },
              then: { $arrayElemAt: ['$requestsMadeData.count', 0] },
              else: 0
            }
          },
          requestsReceivedCount: 0, // Can be populated later if needed
          isCreator: { $gt: [{ $size: '$creatorData' }, 0] },
          creator_portfolio_id: {
            $cond: {
              if: { $gt: [{ $size: '$creatorData' }, 0] },
              then: { $arrayElemAt: ['$creatorData._id', 0] },
              else: null
            }
          }
        }
      });

      pipeline.push({
        $project: {
          visitorData: 0,
          requestsMadeData: 0,
          creatorData: 0
        }
      });
    }

    // Execute aggregation
    let alluser = await userdb.aggregate(pipeline).exec();

    // Filter out blocked users from the alluser list
    const filteredUsers = await filterBlockedUsers(alluser, userid);

    return res.status(200).json({
      ok: true,
      message: `Fetched users successfully`,
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Error in getalluser:', err);
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
}

module.exports = updatePost
