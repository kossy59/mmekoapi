const userdb = require("../../Models/userdb")
let admindb = require("../../Models/admindb")
let userphoto = require("../../Models/usercomplete")

const updatePost = async (req,res)=>{

  try{
    let du = await userdb.find({}).exec()
    let admin = await admindb.find({}).exec()
    let photos = await userphoto.find({}).exec()

    let suppend_user = admin.filter(v=> v.suspend && v.userid)

    // let suppend_user = []

    // admin.forEach(value =>{

    //   if(value.suspend === true){
    //     let user = {
    //         userid: value.userid
    //     }
    //     suppend_user.push(user)
    //   }
    // })

    let list_user = []

    console.log("list of suspend user "+suppend_user.length)

    du.forEach(value1 => {
      if(suppend_user.length > 0){
        suppend_user.forEach(value =>{
            if(String(value1._id) !== String(value.userid)){
                list_user.push(value1)
            }
        })
      }else{
        list_user.push(value1)
      }
    })

    let alluser = []

    list_user.forEach(value1=>{
    photos.forEach(value2 =>{
      if(String(value1._id) === String(value2.useraccountId)){
        let obj = value1.toObject()
        obj.photolink = value2.photoLink
        alluser.push(obj)
      }
    })
    })

  return res.status(200).json({"ok":true,"message":`Post updated Successfully`, users: alluser})


}catch(err){
    return res.status(500).json({"ok":false,'message': `${err.message}!`});
}
}

module.exports = updatePost
