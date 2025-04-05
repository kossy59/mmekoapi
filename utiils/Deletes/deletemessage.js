let messageDB = require("../../Models/message")

let deleteMessage = async()=>{

    let messages = await messageDB.find({}).exec()

    // for(let i = 0; i < messages.length; i++){
    //     await messageDB.deleteOne({_id:messages[i]._id}).exec()
    // }

    let messageID = []

    let today = new Date()

    messages.forEach(value =>{
        let expireDate = new Date(Number(value._id.getTimestamp()))

        let diffTime = today.getTime() - expireDate.getTime()

        let diffDays = Math.round(diffTime / (1000 * 3600 * 24)) 

         if(diffDays >= 14){
            messageID.push(value._id)
        }


    })

    for(let i = 0; i < messageID.length; i++){
        await messageDB.deleteOne({_id:messageID[0]}).exec()
    }

}

module.exports = deleteMessage