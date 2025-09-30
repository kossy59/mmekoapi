// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Creators/userdb")
const comfarm = async (req,res)=>{

    const code = req.body.code;
    const email = req.body.email?.toLowerCase().trim();
  
    //let data = await connectdatabase()
    if(!code && !email){
        return res.status(400).json({"ok":false,'message': 'Please enter authentication code!!'})
    }


    try{
       let du = await userdb.find({email: email}).exec()
       console.log(du)
        if(du){
            if(Number(du.passcode) === Number(code)){
                 du.passcode = "done"
            du.save()
            return res.status(200).json({"ok":true,"message":`Enter new password`,id:`${du._id}`})
            }else{
                return res.status(409).json({"ok":false,"message":`Authentication code mismatch - ` + du.passcode + code})
            }
        }else{
            return res.status(409).json({"ok":false,"message":`No user found for this email - ${email}:`  + du})
        }     
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = comfarm