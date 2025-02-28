let userdb = require("../Models/userdb")
let webpush = require("web-push")
let vapikey = require("./webpushKeys")
let pushdb = require("../Models/pushnotifydb")

const pushmessage = async(userid,message,icon)=>{

    let online = await userdb.findOne({_id:userid}).exec()
    let subinfo = await pushdb.findOne({userid:userid}).exec()

    if(online){
       
            console.log("is online")
            let datasend = JSON.stringify({
                message:message,
                userid:userid,
                icon,icon
            })

            let options = {
              TTL:172800,
              urgency:"high"
            }

            webpush.setVapidDetails(
                'mailto:noreply.mmeko@gmail.com',
                vapikey.PublicKey,
                vapikey.PrivateKey
            )

            if(subinfo){

             try{
                console.log(JSON.parse(subinfo.subinfo)+" subinfo")
                webpush.sendNotification(JSON.parse(subinfo.subinfo),datasend,options)
                console.log("sent notification")
             }catch(err){
                console.log("error in sendimg push "+err)
             }
              
               

            }
        
    }

}

module.exports = pushmessage