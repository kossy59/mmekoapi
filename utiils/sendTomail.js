const nodeMailer = require('nodemailer')

let mail = async(sentname, message, email)=>{

    try{

           let smtpTransport = nodeMailer.createTransport({
            service:'gmail',
            auth:{
                user:process.env.EMAIL,
                pass:process.env.GOOGLEAPPKEY
            }

           });

          

         let mailOption = {
            to:email,
            from:process.env.EMAIL,
            subject:`Notificaton from ${sentname}`,
            text:`${message}`
         }

        smtpTransport.sendMail(mailOption,function(err){
            if(err){
              return false
            }else{
                return true
            }
        })
  
    }catch(err){
        return false
    }
}
module.exports = mail