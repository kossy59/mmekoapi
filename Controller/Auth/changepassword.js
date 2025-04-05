//const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require('bcrypt');
const userdb = require("../../Models/userdb")


require('dotenv').config()

const forgetpass = async (req,res)=>{

    const password = req.body.password;
    const id = req.body.id;
    const isuser = req.body.isuser;

    if(!password || !id){
        return res.status(409).json({"ok":false,'message': `enter new password`});
    }

    try{
   

       let du = await userdb.findOne({_id:id}).exec()

      
       if(du){
        
        if(!isuser){
            if(du.passcode !== "done"){
                return res.status(500).json({"ok":false,'message': `Verify your email first`});
            }
        }
       
        console.log("in progress")

        const hashPwd = await bcrypt.hash(password,10);

        du.password = `${String(hashPwd)}`
        du.save()

        console.log("password change success")

        return res.status(200).json({'ok':true,'message':  "Password Changed Success"});
           
       }else{
        return res.status(401).json({"ok":false,"message":"failed to find mail for authentication"})
       }
        
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err.message}!`});
     }
   
   
}

module.exports = forgetpass;