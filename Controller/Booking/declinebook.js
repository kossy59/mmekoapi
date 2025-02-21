const bookingdb = require("../../Models/book")
const modeldb = require("../../Models/models")
const userdb = require("../../Models/userdb")
let sendEmail = require("../../utiils/sendEmailnot")

const createLike = async (req,res)=>{
     
    const modelid = req.body.modelid;
    const userid = req.body.userid
    const date = req.body.date
    const time = req.body.time
    
   
    if(!modelid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
   // console.log('untop init db')


    try{
         const users = await bookingdb.find({modelid:modelid}).exec()

         let user = users.find(value =>{
            return String(value.status) === "pending"  || String(value.status) === "accepted"  && String(value.userid) === String(userid) && String(value.time) === String(time) && String(value.date) === String(date)
         })

         

         

         if(!user) {
             return res.status(200).json({"ok":false,'message': 'you have 0 pending request!!'})
         }

         let status = await bookingdb.findOne({_id:user._id}).exec()
        
         status.status = "decline"
         status.save()
         let models = await modeldb.findOne({_id:modelid}).exec()
         let modelprice = parseFloat(models.price)
         let clientuser = await userdb.findOne({_id:userid}).exec()

         let clientbalance = parseFloat(clientuser.balance)
         clientbalance = clientbalance + modelprice

         let modelpaymenthistory = {
            userid:userid,
            details: "cancel host refound",
            spent: `${0}`,
            income: `${modelprice}`,
            date: `${Date.now().toString()}`
         }

         await historydb.create(modelpaymenthistory)

         clientuser.balance = `${clientbalance}`
         await  clientuser.save()
         await sendEmail(userid, "Model declined your Booking")
       
        return res.status(200).json({"ok":true,"message":` Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike