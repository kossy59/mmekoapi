const bookingdb = require("../../Models/book")
const userdb = require("../../Models/userdb")
const modeldb = require("../../Models/models")
const historydb = require("../../Models/mainbalance")
let sendEmail = require("../../utiils/sendEmailnot")
let sendpushnote = require("../../utiils/sendPushnot")

const createLike = async (req,res)=>{
     
    const userid = req.body.userid;
    let modelid = req.body.modelid;
    const type = req.body.type;
    const time = req.body.time
    const place = req.body.place
    const date = req.body.date
    const price = req.body.price
   
    if(!modelid  && !userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    //console.log('untop init db')

    //let data = await connectdatabase()

    try{
         const user = await userdb.findOne({_id:userid}).exec()

         let userbalance = parseFloat(user.balance)

         let modelprice = parseFloat(price)

         if(!userbalance){
            userbalance = 0
         }

         let modelemail = await modeldb.findOne({_id:modelid}).exec()

         

        
         let total = userbalance - modelprice

         let clienthistory = {
            userid,
            details: "hosting a model pendding",
            spent: `${modelprice}`,
            income: "0",
            date: `${Date.now().toString()}`
         }

        
         //console.log("user balance "+userbalance)

         if(total < 0 || total === 0 ) {
             return res.status(400).json({"ok":false,'message': 'insuffciate balance!!'})
         }
           
          user.balance = String(total)

         user.save()

         await historydb.create(clienthistory)
         await sendEmail(modelemail.userid, "Accept Booking from User")
         await sendpushnote(modelemail.userid,"Accept Booking from User","modelicon")

       let books  = {
            userid,
            modelid,
            type,
            place,
            time,
            status:"pending",
            date

        }

        await bookingdb.create(books)
       
            return res.status(200).json({"ok":true,"message":`booking Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike