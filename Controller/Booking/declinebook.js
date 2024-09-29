const bookingdb = require("../../Models/book")

const createLike = async (req,res)=>{
     
    const modelid = req.body.modelid;
    const userid = req.body.userid
    const date = req.body.date
    const time = req.body.time
    
   
    if(!modelid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         const users = await bookingdb.find({modelid:modelid}).exec()

         let user = users.find(value =>{
            return String(value.status) === "pending"  && String(value.userid) === String(userid) && String(value.time) === String(time) && String(value.date) === String(date)
         })

         

         

         if(!user) {
             return res.status(200).json({"ok":false,'message': 'you have 0 pending request!!'})
         }

         let status = await bookingdb.findOne({_id:user._id}).exec()

         status.status = "decline"
         status.save()
       
            return res.status(200).json({"ok":true,"message":` Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike