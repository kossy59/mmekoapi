const settingdb = require("../../Creators/settingsdb")
const pushdb = require("../../Creators/pushnotifydb")

let getBlockuser = async(req, res)=>{
    let userid = req.body.userid
    let emailnot = req.body.emailnot
    let pushnot = req.body.pushnot
    let subinfo = req.body.subinfo

    console.log("email note "+emailnot)
    console.log("pushnot note "+pushnot)
    console.log("pushnot info "+subinfo)

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'Invalid  ID!!'})
    }

    let notificaton_turn = await settingdb.findOne({userid:userid}).exec()
    let pushdata = await pushdb.findOne({userid:userid}).exec()

   if(emailnot === true || emailnot === false){
    console.log("running email note")
     if(notificaton_turn){
        notificaton_turn.emailnot = emailnot
        notificaton_turn.save()
     }else{
        let data = {
            userid,
            emailnot
        }

        await settingdb.create(data)
     }
   }

   if(pushnot === true || pushnot === false){
    console.log("running push note")
    if(pushdata){
        if(subinfo){
            pushdata.subinfo = subinfo
            pushdata.save()
        }

    }else{
        if(subinfo){

            let datainfos = {
                userid:userid,
                subinfo:subinfo
            }
    
            await pushdb.create(datainfos)

        }
      
    }
    if(notificaton_turn){
       notificaton_turn.pushnot = pushnot
       notificaton_turn.save()
    }else{
       let data = {
           userid,
           pushnot
       }

       await settingdb.create(data)
    }
  }

    return res.status(200).json({"ok":true,'message': 'Settings updated successfully'})

}

module.exports = getBlockuser;