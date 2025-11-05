const userActivity = require("../Creators/userActivity");
const websiteVisitor = require("../Creators/websiteVisitor");
const userdb = require("../Creators/userdb");

/**
 * Track user connection - called when user connects via socket
 */
const trackUserConnection = async (userid, connectionTime = new Date()) => {
  try {
    if (!userid) return;

    // Get start of day for date normalization
    const today = new Date(connectionTime);
    today.setHours(0, 0, 0, 0);

    // Find or create today's activity record
    let activity = await userActivity.findOne({
      userid,
      date: today,
    });

    if (!activity) {
      activity = await userActivity.create({
        userid,
        date: today,
        sessions: [],
      });
    }

    // Add new session
    activity.sessions.push({
      connectedAt: connectionTime,
      disconnectedAt: null,
      duration: 0,
    });

    await activity.save();
    console.log(`✅ [Tracking] User ${userid} connection tracked`);
  } catch (error) {
    console.error("❌ [Tracking] Error tracking user connection:", error);
  }
};

/**
 * Track user disconnection - called when user disconnects
 */
const trackUserDisconnection = async (userid, disconnectionTime = new Date()) => {
  try {
    if (!userid) return;

    // Get start of day
    const today = new Date(disconnectionTime);
    today.setHours(0, 0, 0, 0);

    // Find today's activity record
    const activity = await userActivity.findOne({
      userid,
      date: today,
    });

    if (!activity || !activity.sessions || activity.sessions.length === 0) {
      return;
    }

    // Find the most recent open session
    const openSession = activity.sessions
      .filter((s) => !s.disconnectedAt)
      .sort((a, b) => b.connectedAt - a.connectedAt)[0];

    if (openSession) {
      openSession.disconnectedAt = disconnectionTime;
      openSession.duration = disconnectionTime - openSession.connectedAt;

      // Update total time spent
      activity.totalTimeSpent = activity.sessions.reduce(
        (total, session) => total + (session.duration || 0),
        0
      );

      await activity.save();
      console.log(`✅ [Tracking] User ${userid} disconnection tracked, session duration: ${Math.round(openSession.duration / 1000 / 60)} minutes`);
    }
  } catch (error) {
    console.error("❌ [Tracking] Error tracking user disconnection:", error);
  }
};

/**
 * Track user activity (posts, likes, comments, etc.)
 */
const trackUserAction = async (userid, actionType = "other") => {
  try {
    if (!userid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's activity record
    let activity = await userActivity.findOne({
      userid,
      date: today,
    });

    if (!activity) {
      activity = await userActivity.create({
        userid,
        date: today,
        activityBreakdown: {
          posts: 0,
          likes: 0,
          comments: 0,
          messages: 0,
          profileViews: 0,
          other: 0,
        },
      });
    }

    // Update activity breakdown
    if (!activity.activityBreakdown) {
      activity.activityBreakdown = {
        posts: 0,
        likes: 0,
        comments: 0,
        messages: 0,
        profileViews: 0,
        other: 0,
      };
    }

    // Increment appropriate counter
    switch (actionType.toLowerCase()) {
      case "post":
        activity.activityBreakdown.posts += 1;
        activity.postsCount += 1;
        break;
      case "like":
        activity.activityBreakdown.likes += 1;
        break;
      case "comment":
        activity.activityBreakdown.comments += 1;
        break;
      case "message":
        activity.activityBreakdown.messages += 1;
        break;
      case "profileview":
        activity.activityBreakdown.profileViews += 1;
        break;
      default:
        activity.activityBreakdown.other += 1;
    }

    activity.activitiesCount += 1;
    await activity.save();
    console.log(`✅ [Tracking] User ${userid} action tracked: ${actionType}`);
  } catch (error) {
    console.error("❌ [Tracking] Error tracking user action:", error);
  }
};

/**
 * Track website visitor (for both logged-in and anonymous users)
 */
const trackWebsiteVisitor = async (visitorData) => {
  try {
    const {
      visitorId,
      userid = null,
      sessionId = null,
      device = {},
      visitTime = new Date(),
    } = visitorData;

    if (!visitorId) return;

    const today = new Date(visitTime);
    today.setHours(0, 0, 0, 0);

    // For logged-in users, use userid as visitorId to ensure one record per user per day
    // For anonymous users, use the visitorId (which is the temporary ID from localStorage)
    const effectiveVisitorId = userid || visitorId || sessionId;
    
    // Try to find existing visitor record for today
    // Check both by visitorId and userid to ensure one record per user per day
    let visitor = null;
    if (userid) {
      // For logged-in users, check by userid first (more reliable)
      visitor = await websiteVisitor.findOne({
        userid: userid,
        date: today,
      });
    }
    
    // If not found and we have a visitorId, check by visitorId (for anonymous users with temp_xxx IDs)
    if (!visitor && effectiveVisitorId) {
      visitor = await websiteVisitor.findOne({
        visitorId: effectiveVisitorId,
        date: today,
      });
    }
    
    // Also check by sessionId as fallback for anonymous users
    if (!visitor && sessionId && !userid) {
      visitor = await websiteVisitor.findOne({
        sessionId: sessionId,
        date: today,
      });
    }

    if (!visitor) {
      // Get user data if logged in
      let userData = {};
      let isAnonymous = true;
      
      if (userid) {
        try {
          const user = await userdb.findById(userid).exec();
          if (user) {
            userData = {
              gender: user.gender,
              signedUp: true,
              firstname: user.firstname,
              lastname: user.lastname,
              username: user.username,
            };
            isAnonymous = false;
          }
        } catch (err) {
          console.error("Error fetching user data for visitor tracking:", err);
        }
      }

      // Create new visitor record - mark as anonymous if no user ID
      visitor = await websiteVisitor.create({
        visitorId: effectiveVisitorId, // Use effective visitor ID
        userid: userid || null,
        sessionId: sessionId || null,
        date: today,
        device,
        firstVisit: visitTime,
        lastVisit: visitTime,
        totalTimeSpent: 0,
        pageViews: 1,
        signedUp: userData.signedUp || false,
        gender: userData.gender || null,
        isAnonymous: isAnonymous && !userid, // Mark as anonymous if no user ID
      });
    } else {
      // Update existing visitor (same user visiting again today - just update page views and last visit)
      visitor.lastVisit = visitTime;
      visitor.pageViews += 1;
      if (userid && !visitor.userid) {
        visitor.userid = userid;
        visitor.isAnonymous = false; // No longer anonymous
        visitor.visitorId = effectiveVisitorId; // Update visitorId to match userid
        // Update signup status if user is logged in
        const user = await userdb.findById(userid).exec();
        if (user) {
          visitor.signedUp = true;
          visitor.gender = user.gender || visitor.gender;
        }
      }
      await visitor.save();
    }

    // Log tracking result
    if (!visitor) {
      console.log(`⚠️ [Tracking] Visitor record was not created or found for: ${effectiveVisitorId}`);
    } else {
      const visitorType = userid ? 'logged-in' : 'anonymous';
      console.log(`✅ [Tracking] Website visitor tracked: ${effectiveVisitorId} (${visitorType}, isNew: ${visitor.pageViews === 1}, pageViews: ${visitor.pageViews})`);
    }
  } catch (error) {
    console.error("❌ [Tracking] Error tracking website visitor:", error);
  }
};

/**
 * Update visitor time spent
 */
const updateVisitorTimeSpent = async (visitorId, timeSpent) => {
  try {
    if (!visitorId || !timeSpent) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to find visitor by visitorId first
    let visitor = await websiteVisitor.findOne({
      visitorId: visitorId,
      date: today,
    });

    // If not found, try to find by userid (for logged-in users)
    if (!visitor) {
      visitor = await websiteVisitor.findOne({
        userid: visitorId, // visitorId might be userid for logged-in users
        date: today,
      });
    }

    // If still not found, try by sessionId (for anonymous users)
    if (!visitor) {
      visitor = await websiteVisitor.findOne({
        sessionId: visitorId, // visitorId might be sessionId for anonymous users
        date: today,
      });
    }

    if (visitor) {
      visitor.totalTimeSpent += timeSpent;
      await visitor.save();
      console.log(`✅ [Tracking] Updated visitor time: ${visitorId}, added ${Math.round(timeSpent / 1000 / 60)} minutes`);
    } else {
      console.log(`⚠️ [Tracking] Visitor not found for time update: ${visitorId}`);
    }
  } catch (error) {
    console.error("❌ [Tracking] Error updating visitor time spent:", error);
  }
};

module.exports = {
  trackUserConnection,
  trackUserDisconnection,
  trackUserAction,
  trackWebsiteVisitor,
  updateVisitorTimeSpent,
};

