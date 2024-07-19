const {userdb} = require('../../Model/userdb');
const {memko_socialDB,database} = require('../../config/connectDB');
const bcrypt = require('bcrypt');


require('dotenv').config()

const forgetpass = async (req,res)=>{

    const password = req.body.password;
    const email = req.body.email;

    if(!password && !email){
        return res.status(409).json({"ok":false,'message': `enter new password`});
    }

    let match = undefined;

    
    
    try{
      const d = await database.getDocument(memko_socialDB,userdb,Query.equal('email',[`${email}`]))
      match = String(d.$id);
        
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err.message}!`});
     }
   
    if(match){
        

        try{

            const hashPwd = await bcrypt.hash(password,10);

            const result = await database.updateDocument(
                memko_socialDB,
                userdb,
                match,
                {
                    password:`${String(hashPwd)}`
                }
            )

            return res.status(200).json({'ok':true,'message':  "Password Changed Success"});
    
    
        }catch(err){
            return res.status(500).json({'ok':false,'message':  err.message});
    
        }


       
    }else{
        return res.status(401).json({"ok":false,"message":"failed to find mail for authentication"})
    }
}

module.exports = forgetpass;