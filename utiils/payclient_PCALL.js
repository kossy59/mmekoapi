const creatordb = require("../Creators/creators")
let bookdb = require("../Creators/book")
let userdb = require("../Creators/userdb")
historydb = require("../Creators/mainbalance")
const pay = async(userid,toid,amount)=>{

    let creatorid = await creatordb.findOne({userid:toid}).exec()

    if(creatorid){
        let users = await bookdb.find({userid:userid}).exec()

        let user = users.find(value=>{
            return String(value.creatorid) === String(creatorid._id ) && String(value.type) === "Private show"
        })

        if(!user) {
            return 
        }

          // getting creator for knowing it booking price
          //let creator = await creatordb.findOne({_id:uscreatorid}).exec()
          
          //console.log("creator price "+price)
         let user_paying = await userdb.findOne({_id:userid}).exec()
        

          // getting user of that creator for adding the payment to it's account
          let creatoruser = await userdb.findOne({_id:creatorid.userid}).exec()
          let creatorwitdraw = parseFloat( creatoruser.withdrawbalance);
          
 
          let creatorpaymenthistory = {
             userid:creatorid.userid,
             details:`private call payment from ${user_paying.firstname} ${user_paying.lastname} `,
             spent: `${0}`,
             income: `${amount}`,
             date: `${Date.now().toString()}`
          }
 
          await historydb.create(creatorpaymenthistory)
 
 
          if(!creatorwitdraw){
             creatorwitdraw = 0
          }
 
          creatorwitdraw = creatorwitdraw + parseFloat(amount)
 
          creatoruser.withdrawbalance = `${creatorwitdraw}`
          await creatoruser.save()
          user.status = "completed"
          await user.save()


 


    }
  
}

module.exports = pay;