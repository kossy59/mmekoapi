const {connectdatabase} = require('./../config/connectDB');
const sdk = require("node-appwrite");

const checkuser = async(userid)=>{

      let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

            let du = dupplicate.documents.find(value=>{
                return value.$id === userid 
               })
        
               if(!du){
                return 
        
               }

              


 

            await data.databar.updateDocument(
                data.dataid,
                data.colid,
                 du.$id,
                {
                   active:true
                }
            )

            return 
      
          
       }catch(err){
           return 
       }

}

module.exports = checkuser;