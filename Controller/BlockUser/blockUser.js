const BlockUser = require('../../Creators/blockuser');
const UserDB = require('../../Creators/userdb');

// Block a user
const blockUser = async (req, res) => {
  const { blockerId, blockedUserId, reason } = req.body;

  if (!blockerId || !blockedUserId) {
    return res.status(400).json({ ok: false, message: 'Blocker ID and Blocked User ID are required.' });
  }

  if (blockerId === blockedUserId) {
    return res.status(400).json({ ok: false, message: 'Cannot block yourself.' });
  }

  try {
    // Check if the users exist
    const [blockerExists, blockedUserExists] = await Promise.all([
      UserDB.findById(blockerId),
      UserDB.findById(blockedUserId)
    ]);

    if (!blockerExists) {
      return res.status(404).json({ ok: false, message: 'Blocker user not found.' });
    }
    if (!blockedUserExists) {
      return res.status(404).json({ ok: false, message: 'Blocked user not found.' });
    }

    const existingBlock = await BlockUser.findOne({ blockerId, blockedUserId });
    if (existingBlock) {
      return res.status(409).json({ ok: false, message: 'User already blocked.' });
    }

    const newBlock = new BlockUser({
      blockerId,
      blockedUserId,
      reason,
    });

    await newBlock.save();
    res.status(200).json({ ok: true, message: 'User blocked successfully.' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ ok: false, message: 'Failed to block user.', error: error.message });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  const { blockerId, blockedUserId } = req.body;

  if (!blockerId || !blockedUserId) {
    return res.status(400).json({ ok: false, message: 'Blocker ID and Blocked User ID are required.' });
  }

  try {
    const result = await BlockUser.deleteOne({ blockerId, blockedUserId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: 'Block relationship not found.' });
    }

    res.status(200).json({ ok: true, message: 'User unblocked successfully.' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ ok: false, message: 'Failed to unblock user.', error: error.message });
  }
};

// Get list of blocked users for a given user
const getBlockedUsers = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ ok: false, message: 'User ID is required.' });
  }

  try {
    const blockedRelationships = await BlockUser.find({ blockerId: userId })
      .populate({
        path: 'blockedUserId',
        select: 'firstname lastname nickname photolink online location',
        model: 'UserDB'
      })
      .exec();

    const blockedUsers = blockedRelationships.map(rel => ({
      id: rel.blockedUserId._id,
      name: rel.blockedUserId.nickname || `${rel.blockedUserId.firstname} ${rel.blockedUserId.lastname}`,
      firstname: rel.blockedUserId.firstname,
      lastname: rel.blockedUserId.lastname,
      photolink: rel.blockedUserId.photolink,
      online: rel.blockedUserId.online,
      location: rel.blockedUserId.location,
      blockDate: rel.blockedAt,
      reason: rel.reason,
    }));

    res.status(200).json({ ok: true, blockedUsers });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ ok: false, message: 'Failed to fetch blocked users.', error: error.message });
  }
};

// Check if a user is blocked
const isUserBlocked = async (req, res) => {
  const { blockerId, blockedUserId } = req.body;

  if (!blockerId || !blockedUserId) {
    return res.status(400).json({ ok: false, message: 'Blocker ID and Blocked User ID are required.' });
  }

  try {
    const blockExists = await BlockUser.findOne({ blockerId, blockedUserId });
    res.status(200).json({ ok: true, isBlocked: !!blockExists });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({ ok: false, message: 'Failed to check block status.', error: error.message });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
};