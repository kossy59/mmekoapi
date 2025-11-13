const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
const admindb = require("../../Creators/admindb");
const { pushmessage } = require("../../utiils/sendPushnot");

const updateView = async (req, res) => {
  const { creator_portfolio_id, userId } = req.body;

  const currentCreator = await creators
    .find({
      _id: creator_portfolio_id,
    })
    .exec();

  if (!currentCreator || currentCreator.length === 0) {
    return res.status(404).json({
      ok: false,
      message: `Creator not found`,
    });
  }

  try {
    let currentViews = currentCreator[0].views || [];
    let viewAdded = false;
    let lastNotificationView = currentCreator[0].lastNotificationView || 0;

    if (userId) {
      if (!currentViews.includes(userId)) {
        currentViews.push(userId);
        viewAdded = true;
        try {
          await creators.findByIdAndUpdate(currentCreator[0]._id, {
            views: currentViews,
          });
        } catch (error) {
          return res.status(500).json({
            ok: false,
            message: `${error.message}!`,
          });
        }
      }
    }

    const totalViews = currentViews.length;
    const response = JSON.stringify({
      views: totalViews,
    });

    // Check if notification should be sent (only if a new view was added)
    if (viewAdded && totalViews > 0) {
      let shouldNotify = false;
      let notificationTitle = "";
      let notificationMessage = "";
      let notificationEmoji = "";

      // Determine notification interval based on view count
      // Only send notifications at milestone views (not at 0)
      if (totalViews > 0) {
        if (totalViews < 100) {
          // Below 100 views: every 10 views (10, 20, 30, 40, 50, 60, 70, 80, 90)
          if (totalViews % 10 === 0 && totalViews > lastNotificationView) {
            shouldNotify = true;
            notificationTitle = "You're getting noticed!";
            notificationEmoji = "🎉";
            notificationMessage = `Your profile just hit ${totalViews} views - fans are starting to discover you 👀`;
          }
        } else if (totalViews >= 100 && totalViews < 1000) {
          // Between 100-999 views: every 20 views (100, 120, 140, 160, 180, 200, ...)
          if (totalViews % 20 === 0 && totalViews > lastNotificationView) {
            shouldNotify = true;
            notificationTitle = "Still growing!";
            notificationEmoji = "🔥";
            notificationMessage = `You've reached ${totalViews} total views - your visibility keeps climbing 🚀`;
          }
        } else if (totalViews >= 1000) {
          // 1000+ views: every 100 views (1000, 1100, 1200, 1300, ...)
          if (totalViews % 100 === 0 && totalViews > lastNotificationView) {
            shouldNotify = true;
            notificationTitle = "Creator on the rise!";
            notificationEmoji = "🌟";
            notificationMessage = `You just crossed ${totalViews} views. You're building real momentum - keep it up 💪`;
          }
        }
      }

      // Send notification if needed
      if (shouldNotify) {
        try {
          const creatorUser = await userdb.findOne({ _id: currentCreator[0].userid }).exec();
          
          if (creatorUser) {
            // Send push notification
            await pushmessage(
              currentCreator[0].userid,
              `${notificationEmoji} ${notificationMessage}`,
              "/icons/m-logo.png",
              {
                title: notificationTitle,
                type: "view_milestone",
                url: `/creators/${creator_portfolio_id}`
              }
            );

            // Save notification to database
            await admindb.create({
              userid: currentCreator[0].userid,
              message: `${notificationEmoji} ${notificationMessage}`,
              title: notificationTitle,
              seen: false
            });

            // Update last notification view count
            await creators.findByIdAndUpdate(currentCreator[0]._id, {
              lastNotificationView: totalViews,
            });
          }
        } catch (notifError) {
          // Log error but don't fail the request
          console.error("Error sending view notification:", notifError);
        }
      }
    }

    return res.status(200).json({
      response,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = updateView;
