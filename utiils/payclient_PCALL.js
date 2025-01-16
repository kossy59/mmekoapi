const modeldb = require("../Models/models")
let bookdb = require("../Models/book")
let userdb = require("../Models/userdb")
historydb = require("../Models/mainbalance")
const pay = async(userid,toid)=>{

    let modelid = await modeldb.findOne({userid:toid}).exec()

    if(modelid){
        let users = await bookdb.find({userid:userid}).exec()

        let user = users.find(value=>{
            return String(value.modelid) === String(modelid._id ) && String(value.type) === "Private show"
        })

        if(!user) {
            return 
        }

          // getting model for knowing it booking price
          //let model = await modeldb.findOne({_id:usmodelid}).exec()
          let price = parseFloat( modelid.price)
          //console.log("model price "+price)
         let user_paying = await userdb.findOne({_id:userid}).exec()
         let  userbalance = parseFloat(user_paying.balance)
 
          let total = userbalance - price

          let clienthistory = {
             userid,
             details: "private call payment",
             spent: `${price}`,
             income: "0",
             date: `${Date.now().toString()}`
          }

          if(total < 0 || total === 0 ) {
            return 
         }

         user_paying.balance = `${total}`

        await  user_paying.save()

        await historydb.create(clienthistory)


          // getting user of that model for adding the payment to it's account
          let modeluser = await userdb.findOne({_id:modelid.userid}).exec()
          let modelwitdraw = parseFloat( modeluser.withdrawbalance);
          
 
          let modelpaymenthistory = {
             userid:modelid.userid,
             details: "private call service completed",
             spent: `${0}`,
             income: `${price}`,
             date: `${Date.now().toString()}`
          }
 
          await historydb.create(modelpaymenthistory)
 
 
          if(!modelwitdraw){
             modelwitdraw = 0
          }
 
          modelwitdraw = modelwitdraw + price
 
          modeluser.withdrawbalance = `${modelwitdraw}`
          await modeluser.save()
          user.status = "completed"
          await user.save()


 


    }
  
}

module.exports = pay;