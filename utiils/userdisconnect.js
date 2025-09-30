// const {connectdatabase} = require('./../config/connectDB');
// const sdk = require("node-appwrite");

const userdb = require("../Creators/userdb")

const userdisconnect = async(userid)=>{

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

              

            du.active = false;
            du.save()

            return 
      
          
       }catch(err){
           return 
       }

}

module.exports = userdisconnect;