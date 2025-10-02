const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");

const createCreator = async (req, res) => {
  try {
    let verified = await creators
      .find({
        verify: "live",
      })
      .exec();

    let useronline = await userdb.find().exec();

    if (!verified[0]) {
      return res.status(200).json({
        ok: false,
        message: `user host empty`,
        host: [],
      });
    }

    let host = [];

    for (let i = 0; i < useronline.length; i++) {
      for (let j = 0; j < verified.length; j++) {
        if (String(verified[j].userid) === String(useronline[i]._id)) {
          const photolink = verified[j].creatorfiles.map((creatorfile) => {
            return creatorfile.creatorfilelink;
          });

          listofhost = {
            hostid: verified[j]._id,
            photolink,
            verify: verified[j].verify,
            name: verified[j].name,
            age: verified[j].age,
            location: verified[j].location,
            price: verified[j].price,
            duration: verified[j].duration,
            bodytype: verified[j].bodytype,
            smoke: verified[j].smoke,
            drink: verified[j].drink,
            interestedin: verified[j].interestedin.join(" "),
            height: verified[j].height,
            weight: verified[j].weight,
            description: verified[j].description,
            gender: verified[j].gender,
            timeava: verified[j].timeava.join(" "),
            daysava: verified[j].daysava.join(" "),
            hosttype: verified[j].hosttype,
            online: useronline[i].active,
            userid: verified[j].userid,
            amount: verified[j].price,
            createdAt: verified[j].createdAt,
            updatedAt: verified[j].updatedAt,
            views: verified[j].views.length,
          };

          host.push(listofhost);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      message: `Creator Fetched successfully`,
      host,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createCreator;
