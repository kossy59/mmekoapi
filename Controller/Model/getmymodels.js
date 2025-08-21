const models = require("../../Models/models");

const getMyModels = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  try {
    const currentuser = await models.find({ userid }).exec();

    if (!currentuser || currentuser.length === 0) {
      return res
        .status(200)
        .json({ ok: false, message: "user host empty", host: [] });
    }

    const host = currentuser.map((model) => {
      const photolink = model.modelfiles.map((modelfile) => modelfile.modelfilelink);

      return {
        hostid: model._id,
        photolink,
        verify: model.verify,
        name: model.name,
        age: model.age,
        location: model.location,
        price: model.price,
        duration: model.duration,
        bodytype: model.bodytype,
        smoke: model.smoke,
        drink: model.drink,
        interestedin: model.interestedin,
        height: model.height,
        weight: model.weight,
        description: model.description,
        gender: model.gender,
        timeava: model.timeava,
        daysava: model.daysava,
        hosttype: model.hosttype,
        document: model.document,
      };
    });

    return res.status(200).json({ ok: true, message: "Models Fetched successfully", host });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getMyModels;
