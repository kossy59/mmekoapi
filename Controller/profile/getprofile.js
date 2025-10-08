// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Creators/userdb")
const creators = require("../../Creators/creators")
//const history = require("../../helpers/earning_in_month")
const settingdb = require("../../Creators/settingsdb")


const readProfile = async (req, res) => {



  const userid = req.body.userid;
  let dues;
  let exclusive = false
  let emailnot = false
  let pushnot = false


  // let data = await connectdatabase()

  let Creator_portfolio;

  // console.log('inside profile')

  try {

    // console.log('inside profile database')

    let du = await userdb.findOne({
      _id: userid
    }).exec()
    //console.log('checking creator database')
    let creatorava = await creators.findOne({
      userid: userid
    }).exec()
    let notificaton_turn = await settingdb.findOne({
      userid: userid
    }).exec()

    if (notificaton_turn) {
      emailnot = notificaton_turn.emailnot
      pushnot = notificaton_turn.pushnot
    }


    //  let creatorava = creator.documents.find(value =>{
    //   return value.userid === userid;
    //  })

    if (creatorava) {
      Creator_portfolio = true
    } else {
      Creator_portfolio = false;
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
    dues.creator = Creator_portfolio;
    dues.emailnot = emailnot;
    dues.pushnot = pushnot;
    
    if (creatorava) {
      // let images = creatorava.creatorfiles.split(",")
      if (creatorava.creatorfiles.length > 0) {
        // Use the first creator image
        dues.creatorphotolink = creatorava.creatorfiles[0].creatorfilelink;
      }
      dues.creatorID = creatorava._id
      // dues.creatorphotolink = images[0]
      dues.creatorname = creatorava.name

    }



    
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
