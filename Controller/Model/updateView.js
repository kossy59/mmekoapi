const models = require("../../Models/models");
const userdb = require("../../Models/userdb");

const createModel = async (req, res) => {
  const { modelId, userId } = req.body;
  console.log(modelId, userId);
  if (!userId) {
    return res.status(400).json({
      ok: false,
      message: "Invalid Request",
    });
  }

  const currentModel = await models
    .find({
      _id: modelId,
    })
    .exec();

  if (!currentModel) {
    return res.status(404).json({
      ok: false,
      message: `Model not found`,
    });
  }

  try {
    let currentViews = currentModel[0].views;
    if (!currentViews.includes(userId)) {
      currentViews.push(userId);
      try {
        await models.findByIdAndUpdate(currentModel[0]._id, {
          views: currentViews,
        });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          message: `${error.message}!`,
        });
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

module.exports = createModel;
