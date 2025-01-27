const modeldb = require("../Models/models")
let bookdb = require("../Models/book")
let userdb = require("../Models/userdb")
historydb = require("../Models/mainbalance")
const pay = async(userid,toid,balance,amount)=>{

    let modelid = await modeldb.findOne({userid:toid}).exec()

    if(modelid){
       

          // getting model for knowing it booking price
          //let model = await modeldb.findOne({_id:usmodelid}).exec()
          
          //console.log("model price "+price)
         let user_paying = await userdb.findOne({_id:userid}).exec()
        


          let clienthistory = {
             userid:userid,
             details: `private call payment from ${modelid.name}`,
             spent: `${amount}`,
             income: "0",
             date: `${Date.now().toString()}`
          }


         user_paying.balance = `${balance}`

        await  user_paying.save()

        await historydb.create(clienthistory)


    }
  
}

module.exports = pay;