const creators = require("../../Creators/creators");

const getMyCreator = async (req, res) => {
  const userid = req.body?.userid;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  try {
    // Get all creators for all users (public directory)
    let currentuser = await creators.find({}).exec();

    if (!currentuser || currentuser.length === 0) {
      return res
        .status(200)
        .json({ ok: false, message: `No creators found`, host: [] });
    }

    const host = currentuser.map((creator) => {
      // Ensure creatorfiles always has the photolink entries
      let creatorfiles = creator.creatorfiles || [];
      if (creator.photolink && creator.photolink.length) {
        const linksNotInCreatorfiles = creator.photolink.filter(
          (link) => !creatorfiles.some((f) => f.creatorfilelink === link)
        );
        const photolinkFiles = linksNotInCreatorfiles.map((link) => ({
          creatorfilelink: link,
          creatorfilepublicid: null,
        }));
        creatorfiles = [...creatorfiles, ...photolinkFiles];
      }

      const photolink = creatorfiles.map((f) => f.creatorfilelink);

      return {
        hostid: creator._id,
        photolink,
        creatorfiles, // full files info
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

    return res
      .status(200)
      .json({ ok: true, message: `Creator fetched successfully`, host });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getMyCreator;