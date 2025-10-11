const creatordb = require("../Creators/creators")
let bookdb = require("../Creators/book")
let userdb = require("../Creators/userdb")
historydb = require("../Creators/mainbalance")
const pay = async(userid,toid,amount)=>{

    let creator_portfoliio_Id = await creatordb.findOne({userid:toid}).exec()

    if(creator_portfoliio_Id){
        let users = await bookdb.find({userid:userid}).exec()

        let user = users.find(value=>{
            return String(value.creator_portfoliio_Id) === String(creator_portfoliio_Id._id ) && String(value.type) === "Private show"
        })

        if(!user) {
            return 
        }

          // getting creator for knowing it booking price
          //let creator = await creatordb.findOne({_id:uscreator_portfoliio_Id}).exec()
          
          //console.log("creator price "+price)
         let user_paying = await userdb.findOne({_id:userid}).exec()
        

          // getting user of that creator for adding the payment to it's account
          let creatoruser = await userdb.findOne({_id:creator_portfoliio_Id.userid}).exec()
          let creatorwitdraw = parseFloat( creatoruser.withdrawbalance);
          
 
          let creatorpaymenthistory = {
             userid:creator_portfoliio_Id.userid,
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