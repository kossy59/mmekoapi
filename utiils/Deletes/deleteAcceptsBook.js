let bookingDB = require("../../Models/book")
let userDB = require("../../Models/userdb")
let modelDB = require("../../Models/models")
let historyDB = require("../../Models/mainbalance")

const deteletaccpts = async()=>{
let allbookingss = await bookingDB.find({}).exec()

let allbookings = allbookingss.filter(value=>{
    return String(value.status) === "pending" || String(value.status) === "accepted" || String(value.status) === "decline"
})



 let allUserID = []
 

 let today = new Date

 allbookings.forEach(value=>{
    let expireDate = new Date(Number(value._id.getTimestamp()))

    let diffTime = today.getTime() - expireDate.getTime()

    let diffDays = Math.round(diffTime / (1000 * 3600 * 24))

    if(diffDays >= 30){
        allUserID.push({
            modelid:value.modelid,
            userid:value.userid,
            id:value._id
        })
    }
 })

 for(let i = 0; i < allUserID.length; i++){
    let price = 0
    let userBalance = 0;
    let modelprice = await modelDB.findOne({_id:allUserID[i].modelid}).exec()
    let user = await userDB.findOne({_id:allUserID[i].userid}).exec()

    if(modelprice){
        price = parseFloat(modelprice.price)
    }

    if(user){
        userBalance = parseFloat(user.balance)

        userBalance = userBalance + price

          let modelpaymenthistory = {
            userid:allUserID[i].userid,
            details: "you got a refound from your expire host request",
            spent: `${0}`,
            income: `${price}`,
            date: `${Date.now().toString()}`
         }
 
         user.balance = `${userBalance}`
         user.save()
        
         await historyDB.create(modelpaymenthistory)

         
    }

    await bookingDB.deleteOne({_id:allUserID[i].id})
 }



}

module.exports = deteletaccpts