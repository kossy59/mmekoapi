// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Models/userdb")
const comfarm = async (req,res)=>{

    const code = req.body.code;
    const email = req.body.email;
  
    //let data = await connectdatabase()
    if(!code && !email){
        return res.status(400).json({"ok":false,'message': 'Please enter authentication code!!'})
    }

    try{
    //     let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

    //     let du = dupplicate.documents.filter(value=>{
    //     return value.email === email && value.passcode === code
    //    })

       let du = await userdb.findOne({email:email.toLowerCase()}).exec()


        if(du){

            if(Number(du.passcode) === Number(code)){
                 du.passcode = "done"
            du.save()


            return res.status(200).json({"ok":true,"message":`Enter new password`,id:`${du._id}`})

            }else{
                return res.status(409).json({"ok":false,"message":`Authentication code mismatch`})
            }

            // await data.databar.updateDocument(
            //     data.dataid,
            //     data.colid,
            //      du[0].$id,
            //     {
            //         passcode:`done`
            //     }
            // )

           

        }else{
            return res.status(409).json({"ok":false,"message":`Authentication code mismatch`})
        }
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = comfarm