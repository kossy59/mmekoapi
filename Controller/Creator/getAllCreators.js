const creators = require("../../Creators/creators");

const getAllCreators = async (req, res) => {
  try {
    // Get all creators, sorted by creation date (newest first)
    const allCreators = await creators
      .find({})
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .exec();

    if (!allCreators || allCreators.length === 0) {
      return res
        .status(200)
        .json({ ok: false, message: "No creators found", host: [] });
    }

    const host = allCreators.map((creator) => {
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
        createdAt: creator.createdAt,
        userid: creator.userid,
        // Add VIP and online status for consistency
        isVip: creator.isVip || false,
        vipEndDate: creator.vipEndDate || null,
        isOnline: creator.isOnline || false,
        views: creator.views || 0,
        isFollowing: false, // Default to false for non-authenticated users
      };
    });

    return res.status(200).json({ ok: true, message: "All creators fetched successfully", host });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getAllCreators;
