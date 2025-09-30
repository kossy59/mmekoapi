const creators = require("../../Creators/creators");

const getMyCreators = async (req, res) => {
  const userid = req.body.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  try {
    const currentuser = await creators.find({ userid }).exec();

    if (!currentuser || currentuser.length === 0) {
      return res
        .status(200)
        .json({ ok: false, message: "user host empty", host: [] });
    }

    const host = currentuser.map((creator) => {
      const photolink = creator.creatorfiles.map((creatorfile) => creatorfile.creatorfilelink);

      return {
        hostid: creator._id,
        photolink,
        verify: creator.verify,
        name: creator.name,
        age: creator.age,
        location: creator.location,
        price: creator.price,
        duration: creator.duration,
        bodytype: creator.bodytype,
        smoke: creator.smoke,
        drink: creator.drink,
        interestedin: creator.interestedin,
        height: creator.height,
        weight: creator.weight,
        description: creator.description,
        gender: creator.gender,
        timeava: creator.timeava,
        daysava: creator.daysava,
        hosttype: creator.hosttype,
        document: creator.document,
      };
    });

    return res.status(200).json({ ok: true, message: "Creators Fetched successfully", host });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getMyCreators;
