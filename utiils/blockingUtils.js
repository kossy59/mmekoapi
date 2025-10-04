const BlockUser = require('../Creators/blockuser');

/**
 * Check if two users have a blocking relationship
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} - True if either user has blocked the other
 */
const areUsersBlocked = async (userId1, userId2) => {
  try {
    if (!userId1 || !userId2 || userId1 === userId2) {
      return false;
    }

    // Check if either user has blocked the other
    const blockingRelationship = await BlockUser.findOne({
      $or: [
        { blockerId: userId1, blockedUserId: userId2 },
        { blockerId: userId2, blockedUserId: userId1 }
      ]
    });

    return !!blockingRelationship;
  } catch (error) {
    console.error('[BlockingUtils] Error checking blocking relationship:', error);
    return false;
  }
};

/**
 * Get list of users that a specific user has blocked
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} - Array of blocked user IDs
 */
const getBlockedUserIds = async (userId) => {
  try {
    if (!userId) {
      return [];
    }

    const blockedUsers = await BlockUser.find({ blockerId: userId }).select('blockedUserId');
    const blockedUserIds = blockedUsers.map(block => block.blockedUserId);
    
    return blockedUserIds;
  } catch (error) {
    console.error('[BlockingUtils] Error getting blocked users:', error);
    return [];
  }
};

/**
 * Get list of users that have blocked a specific user
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} - Array of user IDs who have blocked this user
 */
const getBlockedByUserIds = async (userId) => {
  try {
    if (!userId) return [];

    const blockedBy = await BlockUser.find({ blockedUserId: userId }).select('blockerId');
    return blockedBy.map(block => block.blockerId);
  } catch (error) {
    console.error('[BlockingUtils] Error getting blocked by users:', error);
    return [];
  }
};

/**
 * Filter posts to exclude those from blocked users
 * @param {Array} posts - Array of posts
 * @param {string} currentUserId - Current user's ID
 * @returns {Promise<Array>} - Filtered posts
 */
const filterBlockedPosts = async (posts, currentUserId) => {
  try {
    if (!currentUserId || !posts || posts.length === 0) {
      return posts;
    }

    // Get users that current user has blocked
    const blockedUserIds = await getBlockedUserIds(currentUserId);
    
    // Get users who have blocked the current user
    const blockedByUserIds = await getBlockedByUserIds(currentUserId);
    
    // Combine both lists for comprehensive filtering
    const allBlockedUserIds = [...blockedUserIds, ...blockedByUserIds];
    
    if (allBlockedUserIds.length === 0) {
      return posts;
    }

    console.log(`🔍 [BLOCKING_UTILS] Filtering ${posts.length} posts for current user ${currentUserId}`);
    console.log(`🔍 [BLOCKING_UTILS] Users blocked by current user: ${blockedUserIds.length}`);
    console.log(`🔍 [BLOCKING_UTILS] Users who blocked current user: ${blockedByUserIds.length}`);

    // Filter out posts from blocked users (bidirectional)
    const filteredPosts = posts.filter(post => {
      const postUserId = post.userid || post.user?._id;
      
      if (!postUserId) {
        console.warn('Post without valid user ID found:', post);
        return true; // Keep posts without user IDs
      }
      
      // Convert both to strings for comparison
      const postUserIdStr = String(postUserId);
      const isBlocked = allBlockedUserIds.some(blockedId => String(blockedId) === postUserIdStr);
      
      if (isBlocked) {
        console.log(`🔍 [BLOCKING_UTILS] Filtering out post from user ${postUserIdStr}`);
      }
      
      return !isBlocked;
    });
    
    console.log(`🔍 [BLOCKING_UTILS] After filtering: ${filteredPosts.length} posts remaining`);
    return filteredPosts;
  } catch (error) {
    console.error('[BlockingUtils] Error filtering blocked posts:', error);
    return posts;
  }
};

/**
 * Filter users to exclude blocked users
 * @param {Array} users - Array of users
 * @param {string} currentUserId - Current user's ID
 * @returns {Promise<Array>} - Filtered users
 */
const filterBlockedUsers = async (users, currentUserId) => {
  try {
    if (!currentUserId || !users || users.length === 0) {
      return users;
    }

    // Get users that current user has blocked
    const blockedUserIds = await getBlockedUserIds(currentUserId);
    
    if (blockedUserIds.length === 0) {
      return users;
    }

    // Filter out blocked users
    return users.filter(user => {
      const userId = user._id || user.id;
      return !blockedUserIds.includes(userId);
    });
  } catch (error) {
    console.error('[BlockingUtils] Error filtering blocked users:', error);
    return users;
  }
};

module.exports = {
  areUsersBlocked,
  getBlockedUserIds,
  getBlockedByUserIds,
  filterBlockedPosts,
  filterBlockedUsers
};
