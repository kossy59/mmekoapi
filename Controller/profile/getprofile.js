const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readProfile = async (req,res)=>{

    const userid = req.body.userid;
   
    let data = await connectdatabase()

    let ISmodel;

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)
            let  model = await data.databar.listDocuments(data.dataid,data.modelCol)

            let du = dupplicate.documents.filter(value=>{
                return value.$id === userid
               })

               let modelava = model.documents.find(value =>{
                return value.userid === userid;
               })

               if(modelava){
                ISmodel = true
               }else{
                ISmodel = false;
               }
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this post!!'});
        
               }

               du[0].model = ISmodel;
               du[0].modelID = modelava.$id
            return res.status(200).json({"ok":true,"message":`All Post`,profile:du[0]})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readProfile