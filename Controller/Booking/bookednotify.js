const bookingdb = require("../../Models/book")
const userdb = require("../../Models/userdb")
const completedb = require("../../Models/usercomplete")
const admindb = require("../../Models/admindb")
const modeldb = require("../../Models/models")

const createLike = async (req,res)=>{
     
   
    const userid = req.body.userid

    console.log("notificationsss1")

     
    
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
    console.log("notificationsss2")

   


    //let data = await connectdatabase()

    
        let isModel = await modeldb.findOne({userid:userid}).exec()
        let users = []
        if(isModel){
            console.log("this is model")
            users  = await bookingdb.find({modelid:isModel._id}).exec()
            console.log("this is model not "+users.length)
        }
        
         const adminmessage = await admindb.find({userid:userid}).exec()

         let model_list = []

         let user = users.filter(value =>{
            return String(value.status) === "pending" || String(value.status) === "accepted"
         })

         

         

         let listinfos = []

         console.log("notificationsss")

        
         for(let i = 0; i < user.length; i++){

            const client = await userdb.findOne({_id:user[i].userid}).exec()
            const clientphoto = await completedb.findOne({useraccountId:user[i].userid}).exec()
            

               model_list.push(
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
   


         

       
            return res.status(200).json({"ok":true,"message":` Success`,data:{model:model_list,notify:listinfos}})
      
          
    //    catch(err){
    //        return res.status(500).json({"ok":false,'message': `${err.message}!`});
    //    }
}

module.exports = createLike