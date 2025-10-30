// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const creators = require("../../Creators/creators");
let crushdb = require("../../Creators/crushdb");
let userdb = require("../../Creators/userdb");
const createCreator = async (req, res) => {
  const hostid = req.body.hostid;
  const userid = req.body.userid;
  let added = false;

  if (!hostid) {
    return res.status(400).json({
      ok: false,
      message: "user Id invalid!!",
    });
  }

  //let data = await connectdatabase()

  try {
    //  let userdb = data.databar.listDocuments(data.dataid,data.creatorCol)
    //  let currentuser = (await userdb).documents.find(value=>{
    //   return value.$id === hostid
    //  })
    const allCreators = await creators.find({}).exec();
    let currentuser = await creators
      .findOne({
        "_id": hostid,
      })
      .exec();
    
    if (!currentuser) {
      return res.status(409).json({
        ok: false,
        message: `user host empty`,
      });
    }

    // Check if the current user has this creator in their crush list
    let istrue = await crushdb
      .findOne({
        creator_portfolio_id: currentuser._id,
        userid: userid
      })
      .exec();

    if (userid && istrue) {
      added = true;
    }

    let modState = await userdb
      .findOne({
        _id: currentuser.userid,
      })
      .exec();

    const photolink = currentuser.creatorfiles
      .map((photolink) => {
        return photolink?.creatorfilelink;
      })
      .filter((link) => link && link.trim() !== ""); // Filter out null/undefined/empty links
    const isFollowingUser = modState.followers.includes(userid);

    let host = {
      hostid: currentuser._id,
      // photolink: currentuser.creatorfiles[0].creatorfilelink,
      photolink,
      verify: modState.creator_verified,
      name: currentuser.name,
      username: modState.username, // Include username from user data
      age: currentuser.age,
      location: currentuser.location,
      price: currentuser.price,
      duration: currentuser.duration,
      bodytype: currentuser.bodytype,
      smoke: currentuser.smoke,
      drink: currentuser.drink,
      interestedin: currentuser.interestedin.join(" "),
      height: currentuser.height,
      weight: currentuser.weight,
      description: currentuser.description,
      gender: currentuser.gender,
      timeava: currentuser.timeava.join(" "),
      daysava: currentuser.daysava.join(" "),
      hosttype: currentuser.hosttype,
      userid: currentuser.userid,
      add: added,
      active: modState.active,
      followingUser: isFollowingUser,
      views: currentuser.views.length,
      createdAt: currentuser.createdAt,
      updatedAt: currentuser.updatedAt,
      // Include VIP status from user data
      isVip: modState.isVip || false,
      vipEndDate: modState.vipEndDate || null,
    };


    res.status(200).json({
      ok: true,
      message: `Creator Fetched successfully`,
      host,
    });
    if (!currentuser.views.includes(userid)) {
      currentuser.views.push(userid);
      await currentuser.save();
    }
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createCreator;
