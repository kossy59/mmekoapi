const nodeMailer = require('nodemailer')
//const {connectdatabase} = require('../../config/connectDB');
const userdb = require("../../Models/userdb")

require('dotenv').config()

const forgetpass = async (req,res)=>{

    const email = req.body.email;
   // let data = await connectdatabase()
    if(!email){
        return res.status(409).json({"ok":false,'message': `enter email address`});
    }

    
    try{
    //     let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //     let du = dupplicate.documents.filter(value=>{
    //     return value.email === email
    //    })

       let du = await userdb.findOne({email:email.toLowerCas()}).exec()

       if(du){
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
            subject:"Please confirm your new  Password Authentication Code",
            text:`${rand}`
        }

        du.passcode = `${String(rand)}`

        // await data.databar.updateDocument(
        //     data.dataid,
        //     data.colid,
        //      du[0].$id,
        //     {
        //         passcode:`${String(rand)}`
        //     }
        // )

        du.save()

      

        smtpTransport.sendMail(mailOption,function(err){
            if(err){
               return res.status(200).json({"ok":true,"message":"code sent to your email"})
            }else{
                return res.status(200).json({"ok":true,"message":"code sent to your email"})
            }
        })
       }else{
        return res.status(401).json({"ok":false,"message":"failed to find mail for authentication"})
    }
        
     }catch(err){
         return res.status(500).json({"ok":false,'message': `${err.message}!`});
     }
   
   
}

module.exports = forgetpass;