const admindb = require("../../Models/admindb")
let userdb = require("../../Models/userdb")
let deleteaccount = require("../../utiils/Deletes/deleteaccount")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
 

        let user = await userdb.findOne({_id:userid}).exec()

        if(!user){
            return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
        }
      
       try{
        

        await deleteaccount(userid)

      



        return res.status(200).json({"ok":true,"message":`Post updated Successfully`,id:userid})
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost