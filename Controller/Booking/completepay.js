const bookingdb = require("../../Models/book")
const modeldb = require("../../Models/models")
const userdb = require("../../Models/userdb")
const historydb = require("../../Models/mainbalance")
let sendEmail = require("../../utiils/sendEmailnot")
let sendpushnote = require("../../utiils/sendPushnot")

const createLike = async (req,res)=>{
    
    const userid = req.body.userid
    const modelid = req.body.modelid
    const time = req.body.time
    const date = req.body.date
    
    
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         const users = await bookingdb.find({userid:userid}).exec()
         const paidname = await userdb.findOne({_id:userid}).exec()

         let user = users.find(value =>{
            return String(value.status) === "accepted" && String(value.modelid) === String(modelid) && String(value.time) === String(time) && String(value.date) === String(date)
         })

          //console.log('under user pending')

         

         

         if(!user) {
             return res.status(200).json({"ok":false,'message': 'you have 0 approved request!!'})
         }

         // getting model for knowing it booking price
         let model = await modeldb.findOne({_id:user.modelid}).exec()
         let price = parseFloat( model.price)
         console.log("model price "+price)

         if(user.type !== "Private show"){

            let modeluser = await userdb.findOne({_id:model.userid}).exec()
            let modelwitdraw = parseFloat( modeluser.withdrawbalance);
            
   
            let modelpaymenthistory = {

               userid:model.userid,
               details: "hosting service completed",
               spent: `${0}`,
               income: `${price}`,
               date: `${Date.now().toString()}`
            }
   
            await historydb.create(modelpaymenthistory)
   
   
            if(!modelwitdraw){
               modelwitdraw = 0
            }
   
            modelwitdraw += price
   
            modeluser.withdrawbalance = `${modelwitdraw}`
            modeluser.save()

            await sendEmail(`${modeluser._id}`, `You received ${price} from ${paidname.firstname}`)
            await sendpushnote(`${modeluser._id}`,`You received ${price} from ${paidname.firstname}`,"modelicon")
         }

         // getting user of that model for adding the payment to it's account
        
         user.status = "completed"
         await user.save()


            return res.status(200).json({"ok":true,"message":` Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike