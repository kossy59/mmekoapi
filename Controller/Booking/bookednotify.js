const bookingdb = require("../../Models/book")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const admindb = require("../../Models/admindb")

const createLike = async (req,res)=>{
     
    const modelid = req.body.modelid;
    const userid = req.body.userid

    console.log("notificationsss1")

     
    
   
    if(!modelid && !userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log("notificationsss2")

   


    //let data = await connectdatabase()

    try{
         const users = await bookingdb.find({modelid:modelid}).exec()
         const adminmessage = await admindb.find({userid:userid}).exec()

         let user = users.filter(value =>{
            return String(value.status) === "pending" || String(value.status) === "accepted"
         })

         

         

         if(!user[0] && !adminmessage[0]) {
             return res.status(200).json({"ok":false,'message': 'you have 0 pending request!!',notify:[]})
         }

         let listinfos = []

         console.log("notificationsss")

        
         for(let i = 0; i < user.length; i++){

            const client = await userdb.findOne({_id:user[i].userid}).exec()
            const clientphoto = await completedb.findOne({useraccountId:user[i].userid}).exec()
            

               listinfos.push(
                    { 
                    name : client.firstname,
                    type : user[i].type,
                    date : user[i].date,
                    time : user[i].time,
                    photolink : clientphoto.photoLink,
                    clientid : client._id,
                    place: user[i].place ,
                    modelid: user[i].modelid,
                    status : user[i].status,
                    ismessage:false,
                    notification:false
                    }
               )

             
            
         }

        adminmessage.forEach(value=>{

        if(value.seen){

            let data = {
            message : value.message,
            time : `${value._id.getTimestamp().getTime()}`,
            ismessage:true,
            id:value._id,
            admindb:true,
            notification:false

            }

            listinfos.push(data)
        }
        
        })
   


         

       
            return res.status(200).json({"ok":true,"message":` Success`,notify:listinfos})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike