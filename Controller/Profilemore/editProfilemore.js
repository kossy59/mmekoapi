const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const photoLink = req.body.photoLink;
    


    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.userincol)

            let du = dupplicate.documents.filter(value=>{
                return value.useraccountId === userid 
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

               let PhotoLink = du[0].photoLink;
               


            if(!photoLink){
                photoLink = PhotoLink;
            }



            await data.databar.updateDocument(
                data.dataid,
                data.userincol,
                 du[0].$id,
                {
                    photoLink,
                   
                }
            )

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,profile:du[0]})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost