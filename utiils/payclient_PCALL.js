const modeldb = require("../Models/models")
let bookdb = require("../Models/book")
let userdb = require("../Models/userdb")
historydb = require("../Models/mainbalance")
const pay = async(userid,toid,amount)=>{

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
          
          //console.log("model price "+price)
         let user_paying = await userdb.findOne({_id:userid}).exec()
        

          // getting user of that model for adding the payment to it's account
          let modeluser = await userdb.findOne({_id:modelid.userid}).exec()
          let modelwitdraw = parseFloat( modeluser.withdrawbalance);
          
 
          let modelpaymenthistory = {
             userid:modelid.userid,
             details:`private call payment from ${user_paying.firstname} ${user_paying.lastname} `,
             spent: `${0}`,
             income: `${amount}`,
             date: `${Date.now().toString()}`
          }
 
          await historydb.create(modelpaymenthistory)
 
 
          if(!modelwitdraw){
             modelwitdraw = 0
          }
 
          modelwitdraw = modelwitdraw + parseFloat(amount)
 
          modeluser.withdrawbalance = `${modelwitdraw}`
          await modeluser.save()
          user.status = "completed"
          await user.save()


 


    }
  
}

module.exports = pay;