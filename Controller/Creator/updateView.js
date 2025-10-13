const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
const updateView = async (req, res) => {
  const { creator_portfolio_id, userId } = req.body;

  const currentCreator = await creators
    .find({
      _id: creator_portfolio_id,
    })
    .exec();

  if (!currentCreator) {
    return res.status(404).json({
      ok: false,
      message: `Creator not found`,
    });
  }

  try {
    let currentViews = currentCreator[0].views;
    if (userId) {
      if (!currentViews.includes(userId)) {
        currentViews.push(userId);
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

    const response = JSON.stringify({
      views: currentViews.length,
    });

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
