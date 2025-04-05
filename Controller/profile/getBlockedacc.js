const blockuserdb = require("../../Models/BlockedDB")
const userdb = require("../../Models/userdb")
const imagedb = require("../../Models/usercomplete")

let getBlockuser = async(req, res)=>{
    let userid = req.body.userid

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'Invalid  ID!!'})
    }

    let listUsers = []


    let listofblock = await blockuserdb.find({}).exec()
    let Users = await userdb.find({}).exec()
    let userphoto = await imagedb.find({}).exec()
    
    for(let i = 0; i < listofblock.length; i++){
        let photolink = ""
        let userInfo = Users.find(value => String(value._id) === listofblock[i].blocked_userid)
        if(userInfo){
            let imageinfo = userphoto.find(value => value.useraccountId === listofblock[i].blocked_userid)

            if(imageinfo){{
                if(imageinfo.photoLink){
                    photolink = imageinfo.photoLink
                }
            }}

            let data = {
                name : `${userInfo.firstname} ${userInfo.lastname}`,
                id : listofblock[i]._id,
                location : userInfo.country,
                online: userInfo.active,
                photolink

            }

            listUsers.push(data)
        }
    }


    
    return res.status(200).json({"ok":true,'message': 'Account Delete Success', users:listUsers})


}

module.exports = getBlockuser;