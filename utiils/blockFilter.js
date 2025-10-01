const BlockUser = require("../Creators/blockuser");

/**
 * Filter out blocked users from a list of users
 * @param {Array} users - Array of user objects
 * @param {string} currentUserId - ID of the current user
 * @returns {Array} - Filtered array without blocked users
 */
const filterBlockedUsers = async (users, currentUserId) => {
  if (!users || !Array.isArray(users) || users.length === 0) {
    return users;
  }

  if (!currentUserId) {
    return users;
  }

  try {
    // Get all blocked user IDs for the current user
    const blockedUsers = await BlockUser.find({ blockerId: currentUserId })
      .select('blockedUserId');
    
    const blockedUserIds = blockedUsers.map(block => block.blockedUserId.toString());

    // Filter out blocked users
    const filteredUsers = users.filter(user => {
      const userId = user._id ? user._id.toString() : user.id ? user.id.toString() : user;
      return !blockedUserIds.includes(userId);
    });

    console.log(`🔒 [BLOCK_FILTER] Filtered ${users.length - filteredUsers.length} blocked users from ${users.length} total users`);
    
    return filteredUsers;
  } catch (error) {
    console.error("❌ [BLOCK_FILTER] Error filtering blocked users:", error);
    return users; // Return original array if filtering fails
  }
};

/**
 * Check if a specific user is blocked by the current user
 * @param {string} currentUserId - ID of the current user
 * @param {string} targetUserId - ID of the user to check
 * @returns {boolean} - True if user is blocked
 */
const isUserBlocked = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId) {
    return false;
  }

  try {
    const block = await BlockUser.findOne({
      blockerId: currentUserId,
      blockedUserId: targetUserId
    });

    return !!block;
  } catch (error) {
    console.error("❌ [IS_USER_BLOCKED] Error checking block status:", error);
    return false;
  }
};

/**
 * Get blocked user IDs for a specific user
 * @param {string} userId - ID of the user
 * @returns {Array} - Array of blocked user IDs
 */
const getBlockedUserIds = async (userId) => {
  if (!userId) {
    return [];
  }

  try {
    const blockedUsers = await BlockUser.find({ blockerId: userId })
      .select('blockedUserId');
    
    return blockedUsers.map(block => block.blockedUserId.toString());
  } catch (error) {
    console.error("❌ [GET_BLOCKED_USER_IDS] Error getting blocked user IDs:", error);
    return [];
  }
};

/**
 * Add block filtering to MongoDB query
 * @param {Object} query - MongoDB query object
 * @param {string} currentUserId - ID of the current user
 * @param {string} userField - Field name that contains user ID (default: '_id')
 * @returns {Object} - Modified query with block filtering
 */
const addBlockFilterToQuery = async (query, currentUserId, userField = '_id') => {
  if (!currentUserId) {
    return query;
  }

  try {
    const blockedUserIds = await getBlockedUserIds(currentUserId);
    
    if (blockedUserIds.length > 0) {
      query[userField] = { $nin: blockedUserIds };
    }

    return query;
  } catch (error) {
    console.error("❌ [ADD_BLOCK_FILTER_TO_QUERY] Error adding block filter:", error);
    return query;
  }
};

/**
 * Filter messages to exclude those from blocked users
 * @param {Array} messages - Array of message objects
 * @param {string} currentUserId - ID of the current user
 * @returns {Array} - Filtered messages
 */
const filterBlockedMessages = async (messages, currentUserId) => {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  if (!currentUserId) {
    return messages;
  }

  try {
    const blockedUserIds = await getBlockedUserIds(currentUserId);
    
    const filteredMessages = messages.filter(message => {
      const fromId = message.fromid ? message.fromid.toString() : message.fromId ? message.fromId.toString() : null;
      const toId = message.toid ? message.toid.toString() : message.toId ? message.toId.toString() : null;
      
      // Keep message if neither sender nor receiver is blocked
      return !blockedUserIds.includes(fromId) && !blockedUserIds.includes(toId);
    });

    console.log(`🔒 [BLOCK_MESSAGE_FILTER] Filtered ${messages.length - filteredMessages.length} blocked messages from ${messages.length} total messages`);
    
    return filteredMessages;
  } catch (error) {
    console.error("❌ [BLOCK_MESSAGE_FILTER] Error filtering blocked messages:", error);
    return messages;
  }
};

module.exports = {
  filterBlockedUsers,
  isUserBlocked,
  getBlockedUserIds,
  addBlockFilterToQuery,
  filterBlockedMessages
};
