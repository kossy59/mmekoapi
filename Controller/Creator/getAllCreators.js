const creators = require("../../Creators/creators");

const getAllCreators = async (req, res) => {
  try {
    // Get all creators (no sorting at database level for flexibility)
    const allCreators = await creators
      .find({})
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
        isVip: creator.isVip || false,
        vipEndDate: creator.vipEndDate || null,
        isOnline: creator.isOnline || false,
        views: creator.views || 0,
        isFollowing: false,
      };
    });

    // YOUR CUSTOM SORTING LOGIC HERE
    // YOUR CUSTOM SORTING LOGIC HERE
    host.sort((a, b) => {
      // Priority 1: Online creators first
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;

      // Priority 2: Most views (highest first)
      const viewsA = a.views || 0;
      const viewsB = b.views || 0;
      return viewsB - viewsA;

      // Priority 3: Newest creators (tie-breaker) - Optional but good for stability
      // const dateA = new Date(a.createdAt || 0).getTime();
      // const dateB = new Date(b.createdAt || 0).getTime();
      // return dateB - dateA;
    });

    return res.status(200).json({
      ok: true,
      message: "All creators fetched successfully",
      host
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getAllCreators;