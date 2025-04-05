const completedb = require("../../Models/usercomplete")
const userdb = require("../../Models/userdb")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    try{

               let du = await completedb.findOne({useraccountId:userid}).exec()
               let usersedit = await userdb.findOne({_id:userid}).exec()
        
               if(!du && !usersedit){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

                let data = {
                id: usersedit._id,
                photolink: du.photoLink,
                firstname: usersedit.firstname,
                lastname: usersedit.lastname,
                state: usersedit.state,
                country: usersedit.country,
                bio: du.details,
             }


            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,data:data})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost