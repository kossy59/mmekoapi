//const {connectdatabase} = require('../../config/connectDB');
const bcrypt = require('bcrypt');
const userdb = require("../../Models/userdb")


require('dotenv').config()

const forgetpass = async (req,res)=>{

    const password = req.body.password;
    const id = req.body.id;

    //let data = await connectdatabase()
    if(!password && !id){
        return res.status(409).json({"ok":false,'message': `enter new password`});
    }



    //let match = undefined;

    
    
    try{
    //   let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //     let du = dupplicate.documents.filter(value=>{
    //     return value.$id === id
    //    })

       let du = await userdb.findOne({_id:id}).exec()

      
       if(du){

        if(du.passcode !== "done"){
            return res.status(500).json({"ok":false,'message': `Verify your email first`});
           }

           const hashPwd = await bcrypt.hash(password,10);

        //    await data.databar.updateDocument(
        //     data.dataid,
        //     data.colid,
        //      du[0].$id,
        //     {
        //         password:`${String(hashPwd)}`
        //     }
        // )

        du.password = `${String(hashPwd)}`
        du.save()

        return res.status(200).json({'ok':true,'message':  "Password Changed Success"});
           
       }else{
        return res.status(401).json({"ok":false,"message":"failed to find mail for authentication"})
       }
        
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err.message}!`});
     }
   
   
}

module.exports = forgetpass;