let bookingDB = require("../../Creators/book")
let userDB = require("../../Creators/userdb")
let creatorDB = require("../../Creators/creators")
let historyDB = require("../../Creators/mainbalance")

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
            creator_portfolio_id:value.creator_portfolio_id,
            userid:value.userid,
            id:value._id
        })
    }
 })

 for(let i = 0; i < allUserID.length; i++){
    let price = 0
    let userBalance = 0;
    let creatorprice = await creatorDB.findOne({_id:allUserID[i].creator_portfolio_id}).exec()
    let user = await userDB.findOne({_id:allUserID[i].userid}).exec()

    if(creatorprice){
        price = parseFloat(creatorprice.price)
    }

    if(user){
        userBalance = parseFloat(user.balance)

        userBalance = userBalance + price

          let creatorpaymenthistory = {
            userid:allUserID[i].userid,
            details: "you got a refound from your expire host request",
            spent: `${0}`,
            income: `${price}`,
            date: `${Date.now().toString()}`
         }
 
         user.balance = `${userBalance}`
         user.save()
        
         await historyDB.create(creatorpaymenthistory)

         
    }

    await bookingDB.deleteOne({_id:allUserID[i].id})
 }



}

module.exports = deteletaccpts