const bookingdb = require("../../Models/book")
const userdb = require("../../Models/userdb")
const modeldb = require("../../Models/models")
const historydb = require("../../Models/mainbalance")

const createLike = async (req,res)=>{
     
    const modelid = req.body.modelid;
    const date = req.body.date
    const time = req.body.time
    const userid = req.body.userid
    
   
    if(!modelid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
      
         

        let bookings = await bookingdb.find({userid:userid}).exec()
         

         if(!bookings[0]) {
             return res.status(200).json({"ok":false,'message': 'you have 0 pending request!!'})
         }

        let book = bookings.find(value =>{
            return String(value.date) === String(date) && String(value.time) === String(time) && String(value.modelid) === String(modelid) && String(value.status) === "pending"  || String(value.status) === "decline" 
        })

        if(!book) {
             return res.status(200).json({"ok":false,'message': 'you have 0 pending request!!'})
         }

         let modeluser = await modeldb.findOne({_id:modelid}).exec()
         let modelprice = parseFloat(modeluser.price)

         if(book.type !== "Private show"){
            let clientuser = await userdb.findOne({_id: userid}).exec()

         let clientbalance = parseFloat(clientuser.balance)

         if(!clientbalance){
            clientbalance = 0;
         }

         clientbalance = modelprice + clientbalance
         clientuser.balance = `${clientbalance}`
         clientuser.save()

        
        let modelpaymenthistory = {
            userid:userid,
            details: "Refound issued; model cancellation confirmation",
            spent: `${0}`,
            income: `${modelprice}`,
            date: `${Date.now().toString()}`
         }

         await historydb.create(modelpaymenthistory)

         
         }


        await bookingdb.deleteOne({_id:book._id}).exec()

        // console.log("modeil "+modelinfo)

         
      
       
            return res.status(200).json({"ok":true,"message":` Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}
module.exports = createLike