const userdb = require("../../Models/userdb")
const admindb = require("../../Models/admindb");

const updatePost = async (req,res)=>{
   const userid = req.body.userid
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'invalid userID!!'})
    }


    try{
               let adminMSG = await admindb.find({userid:userid}).exec()

               if(!adminMSG){
                return res.status(200).json({"ok":true,'message': 'add users!!',message:[]});
        
               }

              let message = []

              adminMSG.forEach(value=>{

                if(value.message){

                     let data = {
                       message:value.message,
                       id: value._id,
                       time:`${value._id.getTimestamp().getTime()}`,
                       "adimn":true
                    }

                    message.push(data)
                    value.seen = false;
                    value.save()

                }
               
              })

            

              
            return res.status(200).json({"ok":true,"message":`Successfully`,message:message})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost