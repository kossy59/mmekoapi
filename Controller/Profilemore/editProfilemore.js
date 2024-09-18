// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const completedb = require("../../Models/usercomplete")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const photoLink = req.body.photoLink;
    


    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    // let data = await connectdatabase()

    try{

            // let  dupplicate = await data.databar.listDocuments(data.dataid,data.userincol)

            // let du = dupplicate.documents.filter(value=>{
            //     return value.useraccountId === userid 
            //    })

               let du = await completedb.fineOne({useraccountId:userid}).exec()
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

               let PhotoLink = du.photoLink;
               


            if(!photoLink){
                photoLink = PhotoLink;
            }



            // await data.databar.updateDocument(
            //     data.dataid,
            //     data.userincol,
            //      du[0].$id,
            //     {
            //         photoLink,
                   
            //     }
            // )

            du.photoLink = photoLink
            du.save()

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,profile:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost