const userdb = require("../Creators/userdb")
const settingdb = require("../Creators/settingsdb")
let sendTomail = require("./sendTomail")


let sendnote = async(userid, message)=>{

    // Validate userid parameter
    if (!userid || userid === 'undefined' || userid === 'null' || typeof userid !== 'string' || userid.length !== 24) {
        console.log("❌ [SENDEMAILNOT] Invalid userid:", userid);
        return;
    }

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