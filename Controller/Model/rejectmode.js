const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createModel = async (req,res)=>{

    const hostid = req.body.hostid;
    
   
    if(!hostid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
     
    let data = await connectdatabase()

    try{
      

           let userdb = await data.databar.listDocuments(data.dataid,data.modelCol)
          
           let currentuser = userdb.documents.find(value=>{
            return value.$id === hostid
           })

          

           if(!currentuser){
            return res.status(409).json({"ok":false,"message":`no host to update`})
           }

          

          

          let model =  {
            verify:'rejected',
             }
            

            await data.databar.updateDocument(data.dataid,data.modelCol,currentuser.$id,model)


            return res.status(200).json({"ok":true,"message":`host Updated successfully`,hostid:currentuser.$id})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel