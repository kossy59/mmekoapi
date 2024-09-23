const nodeMailer = require('nodemailer')
const {connectdatabase} = require('../config/connectDB')

const userdb = require("../Models/userdb")


require('dotenv').config()

const forgetHandler = async (req,res,email)=>{

  // let database = await connectdatabase();
   
    let match = undefined;
    
    try{
        // let  dupplicate = await database.databar.listDocuments(database.dataid,database.colid)

        // let du = dupplicate.documents.filter(value=>{
        //  return value.email === email
        // })

        match = await userdb.findOne({email:email}).exec()

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
            subject:"Please confirm your new mmekoSocial Account Authentication",
            text:`${rand}`
         }

          match.emailconfirm = `${String(rand)}`
         match.save();

        // const result = await database.databar.updateDocument(
        //     database.dataid,
        //     database.colid,
        //     match.$id,
        //     {
        //         emailconfirm:`${String(rand)}`
        //     }
        // )

       

      

        smtpTransport.sendMail(mailOption,function(err){
            if(err){
              // return res.status(401).json({"ok":false,"message":`${err.message}`})
              return res.status(200).json({"ok":true,"message":"Sending error"})
            }else{
                return res.status(200).json({"ok":true,"message":"code sent to your email"})
            }
        })
    }else{
        return res.status(401).json({"ok":false,"message":"failed to find mail for authentication"})
    }
 
       // match = du[0];
      

    }catch(err){
        return res.status(500).json({"ok":false,'message': `${err.message}!  send search dublicate`});
    }
   
   
}

module.exports = forgetHandler;
