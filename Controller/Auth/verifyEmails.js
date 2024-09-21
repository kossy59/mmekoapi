//const {userdb} = require('../../Model/userdb');
//const {connectdatabase} = require('../../config/connectDB');
//const sdk = require("node-appwrite");
const userdb = require("../../Models/userdb")

const handleNewUser = async (req,res)=>{
    // let data = await connectdatabase()
    const code = req.body.code;
    const email = req.body.email
    let match = undefined;

    if(!code && !email){
        return res.status(400).json({"ok":false,'message': 'Please enter authentication code!!'})
    }

     let Email = email.toLowerCase().trim()
    try{
        //const d = await data.databar.listDocuments(data.dataid,data.colid)
        // match = d.documents.filter(value=>{
        //     return code === value.emailconfirm
        //    })

        match = await userdb.findOne({email:Email}).exec()

       if(match){
        if(Number(match.emailconfirm) === Number(code)){
             match.emailconfirm = `verify`;
         
        // match.emailconfirmtime = `${new Date().toDateString()}`;
         match.save();

         return res.status(200).json({"ok":true,"message":`${match.firstname} ${match.lastname} Account Created Success`,'ID':`${match._id}`})

        }
       else{
            return res.status(409).json({"ok":false,"message":`Authentication code mismatch`})
        }
        // await data.databar.updateDocument(
        //     data.dataid,
        //     data.colid,
        //      match[0].$id,
        //      {
        //          emailconfirm:'verify'
        //      }
        //  )

        //  await data.databar.updateDocument(
        //      data.dataid,
        //      data.colid,
        //      match[0].$id,
        //      {
        //          emailconfirmtime:`${new Date().toDateString()}`
        //      }
        //  )

        
       }

       else{
            return res.status(409).json({"ok":false,"message":`email code mismatch`})
        }
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = handleNewUser;