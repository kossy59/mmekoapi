const models = require("../../Models/models");

const getMyModel = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  try {
    let currentuser = await models.find({ userid: userid }).exec();

    if (!currentuser || currentuser.length === 0) {
      return res
        .status(200)
        .json({ ok: false, message: `User host empty`, host: [] });
    }

    const host = currentuser.map((model) => {
      // Ensure modelfiles always has the photolink entries
      let modelfiles = model.modelfiles || [];
      if (model.photolink && model.photolink.length) {
        const linksNotInModelfiles = model.photolink.filter(
          (link) => !modelfiles.some((f) => f.modelfilelink === link)
        );
        const photolinkFiles = linksNotInModelfiles.map((link) => ({
          modelfilelink: link,
          modelfilepublicid: null,
        }));
        modelfiles = [...modelfiles, ...photolinkFiles];
      }

      const photolink = modelfiles.map((f) => f.modelfilelink);

      return {
        hostid: model._id,
        photolink,
        modelfiles, // full files info
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

    return res
      .status(200)
      .json({ ok: true, message: `Model fetched successfully`, host });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getMyModel;