const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readProfile = async (req,res)=>{

    const userid = req.body.userid;
   
    let data = await connectdatabase()

    let ISmodel;

    console.log('inside profile')

    try{

             console.log('inside profile database')
            let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)
              console.log('inside model database')
            let  model = await data.databar.listDocuments(data.dataid,data.modelCol)

              console.log('ckecking profile database')
            let du = dupplicate.documents.find(value=>{
                return value.$id === userid
               })

                 console.log('checking model database')
               let modelava = model.documents.find(value =>{
                return value.userid === userid;
               })

               if(modelava){
                ISmodel = true
               }else{
                ISmodel = false;
               }
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this post!!'});
        
               }

               du.model = ISmodel;
               if(modelava){
                     du.modelID = modelava.$id
               }
             

               console.log('returning profile' + du)
            return res.status(200).json({"ok":true,"message":`All Post`,profile:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readProfile