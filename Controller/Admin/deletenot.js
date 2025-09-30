const userdb = require("../../Creators/userdb")
const admindb = require("../../Creators/admindb");

const updatePost = async (req,res)=>{
   const id = req.body.id
   
    if(!id){
        return res.status(400).json({"ok":false,'message': 'invalid userID!!'})
    }


    try{
               let adminMSG = await admindb.deleteOne({_id:id}).exec()

              
                return res.status(200).json({"ok":true,'message': 'add users!!'});
        
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost