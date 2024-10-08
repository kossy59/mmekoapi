const bookingdb = require("../../Models/book")
const modeldb = require("../../Models/models")

const createLike = async (req,res)=>{
    
    const userid = req.body.userid
    
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log('untop init db')

   


    //let data = await connectdatabase()

    try{
         const users = await bookingdb.find({userid:userid}).exec()

         let user = users.filter(value =>{
            return String(value.status) === "accepted"  || String(value.status) === "decline"  || String(value.status) === "pending"
         })

         

          //console.log('under user pending')

         

         

         if(!user[0]) {
             return res.status(200).json({"ok":false,'message': 'you have 0 approved request!!',approve:[]})
         }

         let approve = []

         for(let i = 0; i < user.length; i++){
            let image = await modeldb.findOne({_id:user[i].modelid}).exec()
            if (image){
                let photo = image.photolink.split(",")

                approve.push({
                    photolink : photo[0],
                    name : image.name,
                    status : user[i].status,
                    type : user[i].type,
                    date : user[i].date,
                    time : user[i].time,
                    modelid : user[i].modelid,
                    id : user[i]._id

                })
            }
         }
            return res.status(200).json({"ok":true,"message":` Success`,approve})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike