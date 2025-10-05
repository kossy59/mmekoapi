const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");

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

    const host = await Promise.all(currentuser.map(async (creator) => {
      console.log(`🔍 [GETMYCREATOR] Processing creator:`, {
        _id: creator._id,
        name: creator.name,
        userid: creator.userid,
        allFields: Object.keys(creator.toObject ? creator.toObject() : creator)
      });

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

      // Get VIP status from user data
      let vipStatus = { isVip: false, vipEndDate: null };
      
      // Try different possible userid field names
      const possibleUserIds = [
        creator.userid,
        creator.userId,
        creator.user_id,
        creator.ownerId,
        creator.owner_id,
        creator.hostid,
        creator.host_id
      ].filter(Boolean);
      
      console.log(`🔍 [GETMYCREATOR] Possible user IDs for ${creator.name}:`, possibleUserIds);
      
      for (const userId of possibleUserIds) {
        try {
          console.log(`🔍 [GETMYCREATOR] Looking up VIP status for userid: ${userId}`);
          const user = await userdb.findOne({ _id: userId }).exec();
          if (user) {
            vipStatus = {
              isVip: user.isVip || false,
              vipEndDate: user.vipEndDate || null
            };
            console.log(`🦁 [GETMYCREATOR] VIP Status for ${creator.name} (${userId}):`, vipStatus);
            break; // Found user, stop looking
          } else {
            console.log(`❌ [GETMYCREATOR] User not found with userid: ${userId}`);
          }
        } catch (error) {
          console.log(`❌ [GETMYCREATOR] Error fetching VIP status for user ${userId}:`, error);
        }
      }
      
      if (!vipStatus.isVip && possibleUserIds.length === 0) {
        console.log(`❌ [GETMYCREATOR] No userid found for creator ${creator.name}`);
      }

      return {
        hostid: creator._id,
        userid: possibleUserIds[0] || creator.userid, // Include userid for frontend
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
        createdAt: creator.createdAt,
        updatedAt: creator.updatedAt,
        // Include VIP status
        isVip: vipStatus.isVip,
        vipEndDate: vipStatus.vipEndDate,
      };
    }));

    console.log(`📊 [GETMYCREATOR] Returning ${host.length} creators with VIP status`);
    console.log(`🦁 [GETMYCREATOR] VIP Status Summary:`, host.map(h => ({ name: h.name, userid: h.userid, isVip: h.isVip, vipEndDate: h.vipEndDate })));
    
    return res
      .status(200)
      .json({ ok: true, message: `Creator fetched successfully`, host });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getMyCreator;