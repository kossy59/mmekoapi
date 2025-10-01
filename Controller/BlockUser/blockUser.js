const BlockUser = require("../../Creators/blockuser");
const UserDB = require("../../Creators/userdb");

// Block a user
const blockUser = async (req, res) => {
  try {
    const { blockerId, blockedUserId, reason } = req.body;

    // Validate required fields
    if (!blockerId || !blockedUserId) {
      return res.status(400).json({
        ok: false,
        message: "Blocker ID and Blocked User ID are required"
      });
    }

    // Check if users exist
    const [blocker, blockedUser] = await Promise.all([
      UserDB.findById(blockerId),
      UserDB.findById(blockedUserId)
    ]);

    if (!blocker || !blockedUser) {
      return res.status(404).json({
        ok: false,
        message: "One or both users not found"
      });
    }

    // Check if already blocked
    const existingBlock = await BlockUser.findOne({
      blockerId,
      blockedUserId
    });

    if (existingBlock) {
      return res.status(400).json({
        ok: false,
        message: "User is already blocked"
      });
    }

    // Create block relationship
    const block = new BlockUser({
      blockerId,
      blockedUserId,
      reason: reason || "No reason provided"
    });

    await block.save();

    console.log(`✅ [BLOCK_USER] User ${blockerId} blocked user ${blockedUserId}`);

    return res.status(200).json({
      ok: true,
      message: "User blocked successfully",
      blockId: block._id
    });

  } catch (error) {
    console.error("❌ [BLOCK_USER] Error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to block user",
      error: error.message
    });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  try {
    const { blockerId, blockedUserId } = req.body;

    // Validate required fields
    if (!blockerId || !blockedUserId) {
      return res.status(400).json({
        ok: false,
        message: "Blocker ID and Blocked User ID are required"
      });
    }

    // Find and remove block relationship
    const block = await BlockUser.findOneAndDelete({
      blockerId,
      blockedUserId
    });

    if (!block) {
      return res.status(404).json({
        ok: false,
        message: "Block relationship not found"
      });
    }

    console.log(`✅ [UNBLOCK_USER] User ${blockerId} unblocked user ${blockedUserId}`);

    return res.status(200).json({
      ok: true,
      message: "User unblocked successfully"
    });

  } catch (error) {
    console.error("❌ [UNBLOCK_USER] Error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to unblock user",
      error: error.message
    });
  }
};

// Get list of blocked users
const getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        message: "User ID is required"
      });
    }

    // Get blocked users with user details
    const blockedUsers = await BlockUser.find({ blockerId: userId })
      .populate('blockedUserId', 'firstname lastname nickname photolink location online')
      .sort({ blockedAt: -1 });

    const formattedBlockedUsers = blockedUsers.map(block => ({
      id: block.blockedUserId._id,
      name: block.blockedUserId.firstname + ' ' + block.blockedUserId.lastname,
      nickname: block.blockedUserId.nickname,
      photolink: block.blockedUserId.photolink,
      location: block.blockedUserId.location,
      online: block.blockedUserId.online,
      blockedAt: block.blockedAt,
      reason: block.reason
    }));

    console.log(`✅ [GET_BLOCKED_USERS] Found ${blockedUsers.length} blocked users for user ${userId}`);

    return res.status(200).json({
      ok: true,
      message: "Blocked users retrieved successfully",
      blockedUsers: formattedBlockedUsers
    });

  } catch (error) {
    console.error("❌ [GET_BLOCKED_USERS] Error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to retrieve blocked users",
      error: error.message
    });
  }
};

// Check if user is blocked
const isUserBlocked = async (req, res) => {
  try {
    const { blockerId, blockedUserId } = req.body;

    if (!blockerId || !blockedUserId) {
      return res.status(400).json({
        ok: false,
        message: "Both user IDs are required"
      });
    }

    const block = await BlockUser.findOne({
      blockerId,
      blockedUserId
    });

    return res.status(200).json({
      ok: true,
      isBlocked: !!block,
      blockDetails: block ? {
        blockedAt: block.blockedAt,
        reason: block.reason
      } : null
    });

  } catch (error) {
    console.error("❌ [IS_USER_BLOCKED] Error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to check block status",
      error: error.message
    });
  }
};

// Get users who have blocked the current user
const getUsersWhoBlockedMe = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        message: "User ID is required"
      });
    }

    const blockingUsers = await BlockUser.find({ blockedUserId: userId })
      .populate('blockerId', 'firstname lastname nickname photolink')
      .sort({ blockedAt: -1 });

    const formattedBlockingUsers = blockingUsers.map(block => ({
      id: block.blockerId._id,
      name: block.blockerId.firstname + ' ' + block.blockerId.lastname,
      nickname: block.blockerId.nickname,
      photolink: block.blockerId.photolink,
      blockedAt: block.blockedAt,
      reason: block.reason
    }));

    console.log(`✅ [GET_USERS_WHO_BLOCKED_ME] Found ${blockingUsers.length} users who blocked user ${userId}`);

    return res.status(200).json({
      ok: true,
      message: "Users who blocked you retrieved successfully",
      blockingUsers: formattedBlockingUsers
    });

  } catch (error) {
    console.error("❌ [GET_USERS_WHO_BLOCKED_ME] Error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to retrieve users who blocked you",
      error: error.message
    });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
  getUsersWhoBlockedMe
};
