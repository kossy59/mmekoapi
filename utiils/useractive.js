// const {connectdatabase} = require('./../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../Models/userdb")

const checkuser = async(userid)=>{

      //let data = await connectdatabase()

    try{

            // let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

            // let du = dupplicate.documents.find(value=>{
            //     return value.$id === userid 
            //    })

               let du = await userdb.findOne({_id:userid}).exec()
        
               if(!du){
                return 
        
               }

              


 

           

            du.active = true;
            du.save()

            return 
      
          
       }catch(err){
           return 
       }

}

module.exports = checkuser;