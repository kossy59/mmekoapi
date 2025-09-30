// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Models/userdb")
const models = require("../../Models/models")
//const history = require("../../helpers/earning_in_month")
const settingdb = require("../../Models/settingsdb")


const readProfile = async (req, res) => {



  const userid = req.body.userid;
  let dues;
  let exclusive = false
  let emailnot = false
  let pushnot = false


  // let data = await connectdatabase()

  let Creator_listing;

  // console.log('inside profile')

  try {

    // console.log('inside profile database')

    let du = await userdb.findOne({
      _id: userid
    }).exec()
    //console.log('checking model database')
    let modelava = await models.findOne({
      userid: userid
    }).exec()
    let notificaton_turn = await settingdb.findOne({
      userid: userid
    }).exec()

    if (notificaton_turn) {
      emailnot = notificaton_turn.emailnot
      pushnot = notificaton_turn.pushnot
    }


    //  let modelava = model.documents.find(value =>{
    //   return value.userid === userid;
    //  })

    if (modelava) {
      Creator_listing = true
    } else {
      Creator_listing = false;
    }

    if (du.exclusive_verify) {
      exclusive = true
    } else {
      exclusive = false
    }

    if (!du) {
      return res.status(409).json({
        "ok": false,
        'message': 'current user can not edit this post!!'
      });

    }

    dues = du.toObject()
    dues.exclusive = exclusive;
    dues.model = Creator_listing;
    dues.emailnot = emailnot;
    dues.pushnot = pushnot;
    if (modelava) {
      // let images = modelava.modelfiles.split(",")
      if (modelava.modelfiles.length > 0) {
        // Use the first model image
        dues.modelphotolink = modelava.modelfiles[0].modelfilelink;
      }
      dues.modelID = modelava._id
      // dues.modelphotolink = images[0]
      dues.modelname = modelava.name

    }


    // Debug logging
    console.log("📊 [getprofile] Returning profile data:", {
      firstname: dues.firstname,
      lastname: dues.lastname,
      nickname: dues.nickname,
      bio: dues.bio,
      hasPhotolink: !!dues.photolink,
      photolinkLength: dues.photolink?.length,
      photolinkPreview: dues.photolink?.substring(0, 50) + '...',
      hasPhotoID: !!dues.photoID,
      photoID: dues.photoID
    });

    // console.log('returning profile' + du)
    return res.status(200).json({
      "ok": true,
      "message": `All Post`,
      profile: dues
    })


  } catch (err) {
    return res.status(500).json({
      "ok": false,
      'message': `${err.message}!`
    });
  }
}

module.exports = readProfile
