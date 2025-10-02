const BlockUser = require('../Creators/blockuser');

/**
 * Filters out messages where either the sender or receiver is blocked by the current user.
 * Also filters out messages where the current user is blocked by the sender/receiver.
 *
 * @param {Array<Object>} messages - An array of message objects. Each message should have fromid and toid.
 * @param {string} currentUserId - The ID of the currently logged-in user.
 * @returns {Promise<Array<Object>>} A new array of messages with blocked conversations filtered out.
 */
const filterBlockedMessages = async (messages, currentUserId) => {
  if (!messages || messages.length === 0 || !currentUserId) {
    return messages;
  }

  try {
    // Find all users blocked by the current user
    const blockedByCurrentUser = await BlockUser.find({ blockerId: currentUserId }).select('blockedUserId').lean();
    const blockedByUserIds = new Set(blockedByCurrentUser.map(block => block.blockedUserId.toString()));

    // Find all users who have blocked the current user
    const usersWhoBlockedCurrentUser = await BlockUser.find({ blockedUserId: currentUserId }).select('blockerId').lean();
    const blockedMeIds = new Set(usersWhoBlockedCurrentUser.map(block => block.blockerId.toString()));

    return messages.filter(msg => {
      const fromId = msg.fromid.toString();
      const toId = msg.toid.toString();

      // Check if current user has blocked either participant in the message
      const hasBlockedFrom = blockedByUserIds.has(fromId);
      const hasBlockedTo = blockedByUserIds.has(toId);

      // Check if either participant has blocked the current user
      const fromBlockedMe = blockedMeIds.has(fromId);
      const toBlockedMe = blockedMeIds.has(toId);

      // A message is kept if:
      // 1. The current user has not blocked either participant AND
      // 2. Neither participant has blocked the current user
      return !(hasBlockedFrom || hasBlockedTo || fromBlockedMe || toBlockedMe);
    });
  } catch (error) {
    console.error('Error filtering blocked messages:', error);
    return messages; // Return original messages if filtering fails
  }
};

/**
 * Filters out users from a list based on block relationships
 *
 * @param {Array<Object>} users - An array of user objects
 * @param {string} currentUserId - The ID of the currently logged-in user
 * @returns {Promise<Array<Object>>} A new array of users with blocked users filtered out
 */
const filterBlockedUsers = async (users, currentUserId) => {
  if (!users || users.length === 0 || !currentUserId) {
    return users;
  }

  try {
    // Find all users blocked by the current user
    const blockedByCurrentUser = await BlockUser.find({ blockerId: currentUserId }).select('blockedUserId').lean();
    const blockedByUserIds = new Set(blockedByCurrentUser.map(block => block.blockedUserId.toString()));

    // Find all users who have blocked the current user
    const usersWhoBlockedCurrentUser = await BlockUser.find({ blockedUserId: currentUserId }).select('blockerId').lean();
    const blockedMeIds = new Set(usersWhoBlockedCurrentUser.map(block => block.blockerId.toString()));

    return users.filter(user => {
      const userId = user._id.toString();
      
      // Check if current user has blocked this user
      const hasBlockedUser = blockedByUserIds.has(userId);
      
      // Check if this user has blocked the current user
      const userBlockedMe = blockedMeIds.has(userId);

      // A user is kept if:
      // 1. The current user has not blocked this user AND
      // 2. This user has not blocked the current user
      return !(hasBlockedUser || userBlockedMe);
    });
  } catch (error) {
    console.error('Error filtering blocked users:', error);
    return users; // Return original users if filtering fails
  }
};

/**
 * Adds block filter to a MongoDB query
 *
 * @param {Object} query - The MongoDB query object
 * @param {string} currentUserId - The ID of the currently logged-in user
 * @returns {Promise<Object>} The query with block filters added
 */
const addBlockFilterToQuery = async (query, currentUserId) => {
  if (!currentUserId) {
    return query;
  }

  try {
    // Find all users blocked by the current user
    const blockedByCurrentUser = await BlockUser.find({ blockerId: currentUserId }).select('blockedUserId').lean();
    const blockedByUserIds = blockedByCurrentUser.map(block => block.blockedUserId);

    // Find all users who have blocked the current user
    const usersWhoBlockedCurrentUser = await BlockUser.find({ blockedUserId: currentUserId }).select('blockerId').lean();
    const blockedMeIds = usersWhoBlockedCurrentUser.map(block => block.blockerId);

    // Add $nin (not in) filters to exclude blocked users
    if (blockedByUserIds.length > 0) {
      query._id = { ...query._id, $nin: blockedByUserIds };
    }
    if (blockedMeIds.length > 0) {
      query._id = { ...query._id, $nin: [...(query._id?.$nin || []), ...blockedMeIds] };
    }

    return query;
  } catch (error) {
    console.error('Error adding block filter to query:', error);
    return query; // Return original query if filtering fails
  }
};

/**
 * Check if a user is blocked by another user
 *
 * @param {string} blockerId - The ID of the user who might be blocking
 * @param {string} blockedUserId - The ID of the user who might be blocked
 * @returns {Promise<boolean>} True if blocked, false otherwise
 */
const isUserBlocked = async (blockerId, blockedUserId) => {
  if (!blockerId || !blockedUserId) {
    return false;
  }

  try {
    const blockExists = await BlockUser.findOne({ blockerId, blockedUserId });
    return !!blockExists;
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};

/**
 * Get all user IDs that are blocked by a specific user
 *
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array<string>>} Array of blocked user IDs
 */
const getBlockedUserIds = async (userId) => {
  if (!userId) {
    return [];
  }

  try {
    const blockedUsers = await BlockUser.find({ blockerId: userId }).select('blockedUserId').lean();
    return blockedUsers.map(block => block.blockedUserId.toString());
  } catch (error) {
    console.error('Error getting blocked user IDs:', error);
    return [];
  }
};

module.exports = {
  filterBlockedMessages,
  filterBlockedUsers,
  addBlockFilterToQuery,
  isUserBlocked,
  getBlockedUserIds,
};