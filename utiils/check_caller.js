let videocalldb = require("../Creators/videoalldb")

let Check_caller = async (answerid,callerid)=>{
    let user = await videocalldb.findOne({callerid:answerid}).exec()
    if(user){
        if(user.connected === true && user.clientid === callerid){
            return "store_sdb"
        }else if(user.connected === true && user.clientid !== callerid){
            return "user_busy"
        }else if(user.connected === false && user.clientid === callerid && user.waiting === "wait"){
            return "calling"
        }
    }else{
        //check that user is not calling another user 

        let clientdb = await videocalldb.findOne({clientid:answerid}).exec()
        if(clientdb){
            return "user_busy"
        }else{
            let data = {
                clientid : callerid,
                callerid : answerid,
                connected : false,
                waiting: "wait"
            }

            await videocalldb.create(data)
            return "calling"
        }
    }

}

let deletebyClient = async (clientid)=>{

    await videocalldb.deleteOne({clientid:clientid}).exec()
    await videocalldb.deleteOne({callerid:clientid}).exec()

}

let deletebyCallerid = async (answerid)=>{

    await videocalldb.deleteOne({callerid:answerid}).exec()
    await videocalldb.deleteOne({clientid:answerid}).exec()

}

let check_connected = async (answerid)=>{
 let connect = await videocalldb.findOne({callerid:answerid})
 if(connect){
  if(connect.connected === false){
    connect.connected = true;
    await connect.save()
    return false
  }else if(connect.connected === true){
    return true
  }
 }
}

let deletecallOffline = async(userid)=>{
    let my_id = `v_id_${userid}`

    await videocalldb.deleteOne({clientid:my_id}).exec()
    await videocalldb.deleteOne({callerid:my_id}).exec()
}
module.exports = {Check_caller, deletebyClient,deletebyCallerid, check_connected, deletecallOffline};