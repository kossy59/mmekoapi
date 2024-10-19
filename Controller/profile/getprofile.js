// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Models/userdb")
const models = require("../../Models/models")
const history = require("../../helpers/earning_in_month")

const readProfile = async (req,res)=>{


  
    const userid = req.body.userid;
      let dues;

   
   // let data = await connectdatabase()

    let ISmodel;

    console.log('inside profile')

    try{

             console.log('inside profile database')
           // let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)
            
              console.log('inside model database')
            //let  model = await data.databar.listDocuments(data.dataid,data.modelCol)

              console.log('ckecking profile database')
            // let du = dupplicate.documents.find(value=>{
            //     return value.$id === userid
            //    })
            let du = await userdb.findOne({_id:userid}).exec()
            console.log('checking model database')
            let modelava = await models.findOne({userid:userid}).exec()

                 
              //  let modelava = model.documents.find(value =>{
              //   return value.userid === userid;
              //  })

               if(modelava){
                ISmodel = true
               }else{
                ISmodel = false;
               }
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this post!!'});
        
               }

               dues = du.toObject()

               dues.model = ISmodel;
               if(modelava){
                    let images = modelava.photolink.split(",")
                     dues.modelID = modelava._id
                     dues.modelphotolink = images[0]
                     dues.modelname = modelava.name
               }
             

               console.log('returning profile' + du)
            return res.status(200).json({"ok":true,"message":`All Post`,profile:dues})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readProfile