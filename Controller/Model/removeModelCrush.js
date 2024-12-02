const crushdb = require("../../Models/crushdb")

const createModel = async (req,res)=>{

    const modelid = req.body.modelid;
    const userid = req.body.userid;
   
   
    if(!modelid && !userid){
        return res.status(400).json({"ok":false,'message': 'user Id Or Model Id invalid!!'})
    }
     
    //let data = await connectdatabase()

    try{
      

           //let userdb = await data.databar.listDocuments(data.dataid,data.modelCol)
          
          //  let currentuser = userdb.documents.find(value=>{
          //   return value.$id === hostid
          //  })

           let currentuser = await crushdb.findOne({modelid:modelid}).exec()

           if(!currentuser){
            return res.status(409).json({"ok":false,"message":`model crush not found`})
           }

          if(String(currentuser.userid) === String(userid)){
             await crushdb.deleteOne({_id:currentuser._id}).exec()
             return res.status(200).json({"ok":true,"message":`model crush delete successfully`})
          }

            return res.status(409).json({"ok":false,"message":`Model not found`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel