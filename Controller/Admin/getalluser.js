const userdb = require("../../Creators/userdb")
let userphoto = require("../../Creators/usercomplete")
const { filterBlockedUsers } = require("../../utiils/blockFilter")

const updatePost = async (req,res)=>{
  const userid = req.body.userid;

  try{
    // Get all users with ban status included
    let du = await userdb.find({}).exec()
    let photos = await userphoto.find({}).exec()

    let alluser = []

    // Process users and add photo links
    du.forEach(value1=>{
      photos.forEach(value2 =>{
        if(String(value1._id) === String(value2.useraccountId)){
          let obj = value1.toObject()
          obj.photolink = value2.photoLink
          alluser.push(obj)
        }
      })
    })

    // Filter out blocked users from the alluser list
    const filteredUsers = await filterBlockedUsers(alluser, userid);

  return res.status(200).json({"ok":true,"message":`Fetched all users Successfully`, users: filteredUsers})


}catch(err){
    return res.status(500).json({"ok":false,'message': `${err.message}!`});
}
}

module.exports = updatePost
