const nodeMailer = require('nodemailer')
const {userdb} = require('../../Model/userdb');
const {memko_socialDB,database} = require('../../config/connectDB');

require('dotenv').config()

const forgetpass = async (req,res)=>{

    const email = req.body.email;

    if(!email){
        return res.status(409).json({"ok":false,'message': `enter email address`});
    }

    let match = undefined;
    
    try{
      const d = await database.getDocument(memko_socialDB,userdb,Query.equal('email',[`${email}`]))
      match = String(d.$id);
        
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err.message}!`});
     }
   
    if(match){
        let smtpTransport = nodeMailer.createTransport({
            service:'gmail',
            auth:{
                user:process.env.EMAIL,
                pass:process.env.GOOGLEAPPKEY
            }

        });

        let rand = Math.floor((Math.random()*100000)+100000);

        let mailOption = {
            to:email,
            from:process.env.EMAIL,
            subject:"Please confirm your new Account Password Authentication Code",
            text:`${rand}`
        }

        const result = await database.updateDocument(
            memko_socialDB,
            userdb,
            match,
            {
                passcode:`${String(rand)}`
            }
        )

      

        smtpTransport.sendMail(mailOption,function(err){
            if(err){
               return res.status(401).json({"ok":false,"message":`${err.message}`})
            }else{
                return res.status(200).json({"ok":true,"message":"code sent to your email"})
            }
        })
    }else{
        return res.status(401).json({"ok":false,"message":"failed to find mail for authentication"})
    }
}

module.exports = forgetpass;