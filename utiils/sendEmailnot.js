const userdb = require("../Models/userdb")
const settingdb = require("../Models/settingsdb")
let sendTomail = require("./sendTomail")


let sendnote = async(userid, message)=>{

    let userInfo = await userdb.findOne({_id:userid}).exec()
    let settingON = await settingdb.findOne({userid:userid}).exec()

    if(userInfo){
        if(userInfo.active === false){
            if(settingON){
                if(settingON.emailnot === true){
                  await sendTomail(`${userInfo.firstname} ${userInfo.lastname}`, message, userInfo.email,)
                }
            }
        }
    }

    

}

module.exports = sendnote